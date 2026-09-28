"use server";

import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

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
  source: z.enum(["Ekedalsskolan", "Preschool", "Other"]),
});

export type SchoolEvent = z.infer<typeof schoolEventSchema>;

export async function extractEvents(rawText: string) {
  if (!rawText.trim()) {
    throw new Error("Newsletter text is required.");
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

  const { output: events } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.array({
      element: schoolEventSchema,
      name: "schoolEvents",
      description: "Distinct upcoming events extracted from the newsletter.",
    }),
    system: `You are a scheduling assistant for a family calendar.

Extract every distinct upcoming event from the supplied school newsletter. Include
only events with a clear date. If a year is not stated, assume the year is 2026.
Use YYYY-MM-DD dates and 24-hour HH:MM times. Set is_all_day to true when no
specific start or end time is given. Use "Ekedalsskolan", "Preschool", or "Other"
for the source based on the newsletter context. Do not duplicate events.`,
    prompt: rawText,
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
