import {
  corsHeaders,
  errorResponse,
  HttpError,
  isCorsPreflight,
  jsonResponse,
  requireUser,
} from "../_shared/http.ts";

const responseSchema = {
  type: "OBJECT",
  properties: {
    eyebrow: { type: "STRING" },
    headline: { type: "STRING" },
    description: { type: "STRING" },
    cta: { type: "STRING" },
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          heading: { type: "STRING" },
          body: { type: "STRING" },
        },
        required: ["heading", "body"],
      },
    },
  },
  required: ["eyebrow", "headline", "description", "cta", "sections"],
};

function validateBrief(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Enter a website name and a short business description.");
  }
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const theme =
    typeof input.theme === "string" ? input.theme : "light";

  if (!name || name.length > 80) {
    throw new HttpError(400, "Website name must be between 1 and 80 characters.");
  }
  if (description.length < 12 || description.length > 600) {
    throw new HttpError(400, "Describe your business in 12 to 600 characters.");
  }
  if (email.length > 160 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new HttpError(400, "Enter a valid contact email address.");
  }
  if (!["light", "dark", "warm", "bold"].includes(theme)) {
    throw new HttpError(400, "Choose one of the available website styles.");
  }
  return { name, description, email, theme };
}

function normalizeGeneratedContent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(502, "The AI returned an invalid website draft. Please try again.");
  }
  const response = value as Record<string, unknown>;
  const text = (field: string, fallback: string, limit: number) =>
    typeof response[field] === "string"
      ? response[field].trim().slice(0, limit)
      : fallback;
  const sections = Array.isArray(response.sections)
    ? response.sections.slice(0, 3).map((section) => {
        const item =
          section && typeof section === "object"
            ? section as Record<string, unknown>
            : {};
        return {
          heading:
            typeof item.heading === "string"
              ? item.heading.trim().slice(0, 80)
              : "",
          body:
            typeof item.body === "string"
              ? item.body.trim().slice(0, 400)
              : "",
        };
      }).filter((section) => section.heading && section.body)
    : [];

  if (!text("headline", "", 120) || !text("description", "", 400) || sections.length === 0) {
    throw new HttpError(502, "The AI returned an incomplete website draft. Please try again.");
  }
  return {
    eyebrow: text("eyebrow", "MADE WITH YOU IN MIND", 80),
    headline: text("headline", "", 120),
    description: text("description", "", 400),
    cta: text("cta", "GET IN TOUCH", 35),
    sections,
  };
}

Deno.serve(async (request) => {
  if (isCorsPreflight(request)) {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Use POST to generate a website." }, 405);
  }

  try {
    const { client } = await requireUser(request);
    const bodyText = await request.text();
    if (bodyText.length > 8000) throw new HttpError(413, "The website brief is too long.");

    let input: unknown;
    try {
      input = JSON.parse(bodyText);
    } catch {
      throw new HttpError(400, "The website brief must be valid JSON.");
    }
    const brief = validateBrief(input);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new HttpError(503, "AI generation is not connected. Add a Gemini API key in Supabase Edge Function Secrets.");
    }

    const { data: allowed, error: quotaError } = await client.rpc(
      "consume_website_generation",
    );
    if (quotaError) {
      console.error("Unable to check the website generation limit.", quotaError);
      throw new HttpError(503, "AI generation is not ready yet. Apply the latest database schema and try again.");
    }
    if (!allowed) {
      throw new HttpError(429, "You have used today's five AI generations. Come back tomorrow or edit a saved draft.");
    }

    const prompt = `Create concise, useful homepage copy for this small business website.
Business name: ${brief.name}
What the business does: ${brief.description}
Contact email (use only as context, do not add it to the copy): ${brief.email || "not provided"}

Return an eyebrow, a specific welcoming headline, a 1-2 sentence introduction, a short call-to-action label, and exactly three useful page sections. Each section must have a short heading and a practical 1-2 sentence body. Use only the facts in the brief. Do not invent an address, phone number, certifications, awards, prices, testimonials, years of experience, or guarantees. Do not include HTML, Markdown, URLs, or a second language.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            maxOutputTokens: 900,
            temperature: 0.8,
          },
        }),
      },
    );
    if (response.status === 429) {
      throw new HttpError(429, "Gemini's free-tier limit is temporarily reached. Please wait and try again.");
    }
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini request failed.", response.status, errorBody.slice(0, 500));
      throw new HttpError(502, "The AI provider could not generate this website. Check the Gemini API key and try again.");
    }

    const result = await response.json();
    const generatedText = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("");
    if (!generatedText) {
      throw new HttpError(502, "The AI returned an empty website draft. Please try again.");
    }

    let generatedContent: unknown;
    try {
      generatedContent = JSON.parse(generatedText);
    } catch {
      throw new HttpError(502, "The AI returned an invalid website draft. Please try again.");
    }

    return jsonResponse({
      site: {
        brand: brief.name,
        ...normalizeGeneratedContent(generatedContent),
        email: brief.email,
      },
      theme: brief.theme,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
