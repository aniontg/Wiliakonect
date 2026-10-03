import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getPublishableKey() {
  const keyMap = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keyMap) {
    const keys = JSON.parse(keyMap);
    const defaultKey = Object.values(keys).find(
      (key): key is string =>
        typeof key === "string" && key.startsWith("sb_publishable_"),
    );
    if (defaultKey) return defaultKey;
  }

  const legacyKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyKey) return legacyKey;
  throw new HttpError(500, "Supabase publishable key is not configured.");
}

export async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Sign in to continue.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    throw new HttpError(500, "Supabase URL is not configured for this function.");
  }

  const client = createClient(supabaseUrl, getPublishableKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser(match[1]);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Sign in again.");

  return { client, user: data.user };
}

export function jsonResponse(
  value: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(value), {
    status,
    headers: corsHeaders,
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  console.error("Edge function request failed.", error);
  return jsonResponse(
    { error: "The request could not be completed. Please try again." },
    500,
  );
}

export function isCorsPreflight(request: Request) {
  return request.method === "OPTIONS";
}
