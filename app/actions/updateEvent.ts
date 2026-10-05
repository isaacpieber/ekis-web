"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function getStringField(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string") {
    throw new Error(`Ogiltigt värde för ${name}.`);
  }

  return value;
}

export async function updateEvent(id: string, formData: FormData) {
  if (!uuidPattern.test(id)) {
    throw new Error("Ogiltigt händelse-ID.");
  }

  const title = getStringField(formData, "title").trim();
  const description = getStringField(formData, "description");
  const eventDate = getStringField(formData, "event_date");
  const startTime = getStringField(formData, "start_time");
  const endTime = getStringField(formData, "end_time");
  const source = getStringField(formData, "source");
  const isAllDay = formData.get("is_all_day") === "on";

  if (!title) {
    throw new Error("Händelsen måste ha en titel.");
  }

  const parsedEventDate = new Date(`${eventDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    Number.isNaN(parsedEventDate.getTime()) ||
    parsedEventDate.toISOString().slice(0, 10) !== eventDate
  ) {
    throw new Error("Ogiltigt händelsedatum.");
  }

  if (
    (startTime && !timePattern.test(startTime)) ||
    (endTime && !timePattern.test(endTime))
  ) {
    throw new Error("Ogiltig tid.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Kunde inte verifiera användaren: ${userError.message}`);
  }

  if (!user) {
    throw new Error("Du måste vara inloggad för att ändra händelser.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(
      `Kunde inte verifiera användarrollen: ${profileError.message}`,
    );
  }

  if (profile.role !== "parent") {
    throw new Error("Endast föräldrar får ändra händelser.");
  }

  const { data: updatedEvent, error: updateError } = await supabase
    .from("school_events")
    .update({
      title,
      description: description || null,
      event_date: eventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      is_all_day: isAllDay,
      source: source || null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error(`Kunde inte ändra händelsen: ${updateError.message}`);
  }

  if (!updatedEvent) {
    throw new Error("Händelsen hittades inte eller kunde inte ändras.");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
