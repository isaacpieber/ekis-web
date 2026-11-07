"use server";

import { createClient } from "@/utils/supabase/server";

const MAX_NEWSLETTER_LENGTH = 50_000;

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

  const { error: queueError } = await supabase.from("extraction_jobs").insert({
    user_id: user.id,
    raw_text: newsletterText,
    source: selectedSource,
    week_label: weekContext,
  });

  if (queueError) {
    throw new Error(
      `Unable to queue school event extraction: ${queueError.message}`,
    );
  }

  return { status: "queued" as const };
}
