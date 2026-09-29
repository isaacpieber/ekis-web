"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const MAX_NEWSLETTER_LENGTH = 50_000;
const stockholmTimeZone = "Europe/Stockholm";

const schoolEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must use YYYY-MM-DD format."),
  start_time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Must use 24-hour HH:MM format.",
    )
    .optional(),
  end_time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Must use 24-hour HH:MM format.",
    )
    .optional(),
  is_all_day: z.boolean(),
  source: z.enum(["School", "Preschool", "Other"]),
});

export type SchoolEvent = z.infer<typeof schoolEventSchema>;

export async function extractEvents(
  rawText: string,
  weekContext: string,
  selectedSource: string,
) {
  const newsletterText = rawText.trim();

  if (!newsletterText) {
    throw new Error("Newsletter text is required.");
  }

  if (newsletterText.length > MAX_NEWSLETTER_LENGTH) {
    throw new Error(
      `Newsletter text must not exceed ${MAX_NEWSLETTER_LENGTH.toLocaleString()} characters.`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify the authenticated user: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to extract school events.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(`Unable to verify the user role: ${profileError.message}`);
  }

  if (profile.role !== "parent") {
    throw new Error("Only parents can extract and create school events.");
  }

  const today = formatInTimeZone(new Date(), stockholmTimeZone, "yyyy-MM-dd");
  const { object: events } = await generateObject({
    model: google("gemini-3.8-flash"),
    output: "array",
    schema: schoolEventSchema,
    system: `You are a scheduling assistant for a family calendar.

Extract every distinct upcoming event from the supplied school newsletter. Include
only events with a clear date. Today's current date is ${today}. Use this to
accurately determine the year for any dates mentioned. The newsletter will likely
be in Swedish, but your output must exactly follow the requested JSON schema.
This newsletter was published during ${weekContext}. Use this specific week as the
current baseline to accurately resolve any relative dates (e.g., "this Friday" or
"next week"). Set the source to ${selectedSource} for all extracted events. Use
YYYY-MM-DD dates and 24-hour HH:MM times. Set is_all_day to true when no specific
start or end time is given. Do not duplicate events.`,
    prompt: newsletterText,
  });

  if (events.length === 0) {
    return { success: true, events: [] };
  }

  const { data: insertedEvents, error: insertError } = await supabase
    .from("school_events")
    .insert(events)
    .select();

  if (insertError) {
    throw new Error(`Unable to save school events: ${insertError.message}`);
  }

  return { success: true, events: insertedEvents };
}
