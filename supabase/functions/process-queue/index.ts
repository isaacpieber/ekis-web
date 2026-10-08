import { createClient } from "npm:@supabase/supabase-js@2";

import {
  performExtraction,
  type SchoolEvent,
} from "../_shared/extract.ts";

type ExtractionJob = {
  id: string;
  raw_text: string;
  source: string;
  week_label: string;
  user_id: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, { status });

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (
    !serviceRoleKey ||
    request.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`
  ) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!supabaseUrl) {
    return jsonResponse({ error: "The queue processor is not configured." }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error: claimError } = await supabase.rpc("claim_extraction_jobs");

  if (claimError) {
    return jsonResponse({ error: "Unable to claim extraction jobs." }, 500);
  }

  const jobs = (data ?? []) as ExtractionJob[];
  let completed = 0;
  let retried = 0;
  let failed = 0;
  let processingErrors = 0;

  for (const job of jobs) {
    let events: SchoolEvent[] | null = null;
    let extractionError: string | null = null;

    try {
      events = await performExtraction(
        job.raw_text,
        job.source,
        job.week_label,
        supabase,
      );
    } catch (error) {
      extractionError =
        error instanceof Error
          ? error.message
          : "The AI provider is temporarily unavailable.";
    }

    const { data: result, error: finishError } = await supabase.rpc(
      "finish_extraction_job",
      {
        p_job_id: job.id,
        p_events: extractionError === null ? events : null,
        p_error: extractionError,
      },
    );

    if (finishError) {
      processingErrors += 1;
      continue;
    }

    if (result === "completed") {
      completed += 1;
    } else if (result === "failed") {
      failed += 1;
    } else if (result === "pending") {
      retried += 1;
    } else {
      processingErrors += 1;
    }
  }

  if (processingErrors > 0) {
    return jsonResponse(
      { processed: jobs.length, completed, retried, failed, processingErrors },
      500,
    );
  }

  return jsonResponse({ processed: jobs.length, completed, retried, failed });
});
