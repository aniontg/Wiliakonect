import {
  corsHeaders,
  errorResponse,
  HttpError,
  isCorsPreflight,
  jsonResponse,
  requireUser,
} from "../_shared/http.ts";
import { renderWebsiteFiles } from "../_shared/site-renderer.js";

function getProjectId() {
  const value = Deno.env.get("VERCEL_PROJECT_ID");
  if (!value || !/^prj_[A-Za-z0-9]+$/.test(value)) {
    throw new HttpError(503, "Vercel publishing is not configured. Add the Vercel project ID in Supabase Edge Function Secrets.");
  }
  return value;
}

function getTeamId() {
  return Deno.env.get("VERCEL_TEAM_ID") || "";
}

function getSiteSlug(name: string, id: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `wiliakonect-${slug || "website"}-${id.replaceAll("-", "").slice(0, 8)}`;
}

Deno.serve(async (request) => {
  if (isCorsPreflight(request)) {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Use POST to publish a website." }, 405);
  }

  try {
    const { client, user } = await requireUser(request);
    const bodyText = await request.text();
    if (bodyText.length > 1000) throw new HttpError(413, "Invalid project ID.");
    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      throw new HttpError(400, "The project ID must be valid JSON.");
    }
    const projectId =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).projectId
        : undefined;
    if (typeof projectId !== "string" || !/^[0-9a-f-]{36}$/i.test(projectId)) {
      throw new HttpError(400, "Choose a saved website project to publish.");
    }

    const { data: project, error: projectError } = await client
      .from("website_projects")
      .select("id, user_id, name, site_data, theme")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    if (projectError || !project) {
      throw new HttpError(404, "That saved website could not be found in your account.");
    }

    const token = Deno.env.get("VERCEL_TOKEN");
    if (!token) {
      throw new HttpError(503, "Vercel publishing is not connected. Add your private Vercel token in Supabase Edge Function Secrets.");
    }

    let files: Array<{ file: string; data: string }>;
    try {
      files = renderWebsiteFiles(project.site_data, project.theme);
    } catch (error) {
      console.error("Saved website could not be rendered.", error);
      throw new HttpError(400, "This saved website needs to be generated again before it can be published.");
    }

    const teamId = getTeamId();
    const createUrl = new URL("https://api.vercel.com/v13/deployments");
    createUrl.searchParams.set("forceNew", "1");
    if (teamId) createUrl.searchParams.set("teamId", teamId);

    const vercelResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: getSiteSlug(project.name, project.id),
        project: getProjectId(),
        target: "preview",
        files: files.map((file) => ({
          file: file.file,
          data: file.data,
          encoding: "utf-8",
        })),
      }),
    });
    if (!vercelResponse.ok) {
      const detail = await vercelResponse.text();
      console.error(
        "Vercel deployment request failed.",
        vercelResponse.status,
        detail.slice(0, 500),
      );
      if (vercelResponse.status === 401 || vercelResponse.status === 403) {
        throw new HttpError(502, "Vercel rejected the token or project access. Check your Vercel secrets and project membership.");
      }
      throw new HttpError(502, "Vercel could not publish this website. Check that the selected project is accessible and try again.");
    }

    const deployment = await vercelResponse.json();
    if (
      typeof deployment.id !== "string" ||
      typeof deployment.url !== "string" ||
      !/^[a-z0-9.-]+$/i.test(deployment.url)
    ) {
      console.error("Vercel returned an invalid deployment response.");
      throw new HttpError(502, "Vercel returned an invalid deployment link.");
    }
    const publishedUrl = `https://${deployment.url}`;

    const { error: updateError } = await client
      .from("website_projects")
      .update({ published_url: publishedUrl })
      .eq("id", project.id)
      .eq("user_id", user.id);
    if (updateError) {
      console.error("Unable to save the published website URL.", updateError);
      throw new HttpError(
        502,
        `Vercel started the deployment, but we could not save its link. Check your saved projects; deployment: ${publishedUrl}`,
      );
    }

    return jsonResponse({
      url: publishedUrl,
      state:
        typeof deployment.readyState === "string"
          ? deployment.readyState
          : "BUILDING",
    }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
