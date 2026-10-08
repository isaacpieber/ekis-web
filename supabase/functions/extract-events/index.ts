import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";

import { ExtractionError, performExtraction } from "../_shared/extract.ts";

const requestSchema = z.object({
  text: z.string().trim().min(1).max(50_000),
  source: z.enum(["School", "Preschool", "Other"]),
  weekLabel: z.string().regex(/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/),
});

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const parsedBody = requestSchema.safeParse(body);

  if (!parsedBody.success) {
    return jsonResponse({ error: "The extraction request is invalid." }, 400);
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer (.+)$/i)?.[1];
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!token) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: "The extraction service is not configured." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return jsonResponse({ error: "Unable to verify the user role." }, 500);
  }

  if (profile.role !== "parent") {
    return jsonResponse({ error: "Only parents can extract school events." }, 403);
  }

  try {
    const events = await performExtraction(
      parsedBody.data.text,
      parsedBody.data.source,
      parsedBody.data.weekLabel,
      supabase,
    );

    return jsonResponse({ success: true, events });
  } catch (error) {
    if (error instanceof ExtractionError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    return jsonResponse({ error: "Unable to extract school events." }, 503);
  }
});
