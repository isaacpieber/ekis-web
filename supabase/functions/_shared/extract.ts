import { createGoogleGenerativeAI } from "npm:@ai-sdk/google@4";
import { generateObject } from "npm:ai@7";
import { z } from "npm:zod@4";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const MAX_NEWSLETTER_LENGTH = 50_000;

const schoolEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must use YYYY-MM-DD format.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, "Must be a valid calendar date."),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must use 24-hour HH:MM format.")
    .optional(),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must use 24-hour HH:MM format.")
    .optional(),
  is_all_day: z.boolean(),
  source: z.enum(["School", "Preschool", "Other"]),
});

export type SchoolEvent = z.infer<typeof schoolEventSchema>;

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly status: 429 | 503,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

function getProviderStatus(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const errorRecord = error as Record<string, unknown>;
  const response = errorRecord.response;
  const status =
    errorRecord.statusCode ??
    errorRecord.status ??
    (typeof response === "object" && response !== null
      ? (response as Record<string, unknown>).status
      : undefined);

  return typeof status === "number" ? status : undefined;
}

export async function performExtraction(
  text: string,
  source: string,
  weekLabel: string,
  _supabaseClient: SupabaseClient,
): Promise<SchoolEvent[]> {
  const newsletterText = text.trim();

  if (!newsletterText || newsletterText.length > MAX_NEWSLETTER_LENGTH) {
    throw new ExtractionError("Newsletter text is invalid.", 503);
  }

  if (!["School", "Preschool", "Other"].includes(source)) {
    throw new ExtractionError("The selected source is invalid.", 503);
  }

  if (!/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(weekLabel)) {
    throw new ExtractionError("The newsletter week is invalid.", 503);
  }

  const apiKey = Deno.env.get("AI_API_KEY");

  if (!apiKey) {
    throw new ExtractionError("The AI extraction service is not configured.", 503);
  }

  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
  }).format(new Date());
  const google = createGoogleGenerativeAI({ apiKey });

  try {
    const { object: events } = await generateObject({
      model: google("gemini-3.8-flash"),
      output: "array",
      schema: schoolEventSchema,
      system: `You are a scheduling assistant for a family calendar.

Extract every distinct upcoming event from the supplied school newsletter. Include
only events with a clear date. Today's current date is ${today}. Use this to
accurately determine the year for any dates mentioned. The newsletter will likely
be in Swedish, but your output must exactly follow the requested JSON schema.
This newsletter was published during ${weekLabel}. Use this specific week as the
current baseline to accurately resolve any relative dates (e.g., "this Friday" or
"next week"). Set the source to ${source} for all extracted events. Use
YYYY-MM-DD dates and 24-hour HH:MM times. Set is_all_day to true when no specific
start or end time is given. Do not duplicate events.`,
      prompt: newsletterText,
    });

    return events;
  } catch (error) {
    const providerStatus = getProviderStatus(error);

    if (providerStatus === 429) {
      throw new ExtractionError("The AI provider is rate limiting requests.", 429);
    }

    throw new ExtractionError("The AI provider is temporarily unavailable.", 503);
  }
}
