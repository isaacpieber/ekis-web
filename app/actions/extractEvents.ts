"use server";

import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";
import type {
  Tables,
  TablesInsert,
} from "@/utils/supabase/database.types";

const MAX_NEWSLETTER_LENGTH = 50_000;
const extractionUnavailableMessage =
  "AI är upptagen. Extraktionen har lagts i kö och kommer att bearbetas i bakgrunden.";

type ExtractedEvent = TablesInsert<"school_events">;

type ExtractionResponse = {
  success: true;
  events: ExtractedEvent[];
};

function isTransientFunctionError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    return error.context.status === 429 || error.context.status >= 500;
  }

  return (
    error instanceof FunctionsFetchError ||
    error instanceof FunctionsRelayError
  );
}

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

  if (!/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(weekContext)) {
    throw new Error("The newsletter week must use YYYY-Www format.");
  }

  if (!["School", "Preschool", "Other"].includes(selectedSource)) {
    throw new Error("The selected source is not valid.");
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

  const { data, error } = await supabase.functions.invoke<ExtractionResponse>(
    "extract-events",
    {
      body: {
        text: newsletterText,
        source: selectedSource,
        weekLabel: weekContext,
      },
    },
  );

  if (error) {
    if (!isTransientFunctionError(error)) {
      throw new Error(`Unable to extract school events: ${error.message}`);
    }

    const { error: queueError } = await supabase
      .from("extraction_jobs")
      .insert({
        user_id: user.id,
        raw_text: newsletterText,
        source: selectedSource,
        week_label: weekContext,
      });

    if (queueError) {
      throw new Error(`Unable to queue school event extraction: ${queueError.message}`);
    }

    return {
      status: "queued" as const,
      message: extractionUnavailableMessage,
    };
  }

  if (!data?.success) {
    throw new Error("The extraction service returned an invalid response.");
  }

  if (data.events.length === 0) {
    return { success: true as const, events: [] as Tables<"school_events">[] };
  }

  const { data: insertedEvents, error: insertError } = await supabase
    .from("school_events")
    .insert(data.events)
    .select();

  if (insertError) {
    throw new Error(`Unable to save school events: ${insertError.message}`);
  }

  return { success: true as const, events: insertedEvents };
}
