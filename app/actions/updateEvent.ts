"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function getStringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

export async function updateEvent(
  id: string,
  _previousState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!uuidPattern.test(id)) {
    return { error: "Ogiltigt händelse-ID." };
  }

  const title = getStringField(formData, "title");
  const description = getStringField(formData, "description");
  const eventDate = getStringField(formData, "event_date");
  const startTime = getStringField(formData, "start_time");
  const endTime = getStringField(formData, "end_time");
  const source = getStringField(formData, "source");

  if (
    title === null ||
    description === null ||
    eventDate === null ||
    startTime === null ||
    endTime === null ||
    source === null
  ) {
    return { error: "Formuläret innehåller ogiltiga uppgifter." };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { error: "Händelsen måste ha en titel." };
  }

  const parsedEventDate = new Date(`${eventDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    Number.isNaN(parsedEventDate.getTime()) ||
    parsedEventDate.toISOString().slice(0, 10) !== eventDate
  ) {
    return { error: "Ogiltigt händelsedatum." };
  }

  if (
    (startTime && !timePattern.test(startTime)) ||
    (endTime && !timePattern.test(endTime))
  ) {
    return { error: "Ogiltig tid." };
  }

  const isAllDay = formData.get("is_all_day") === "on";
  if (isAllDay && (startTime || endTime)) {
    return {
      error: "En heldagshändelse kan inte ha en vald start- eller sluttid.",
    };
  }

  if (!isAllDay && (!startTime || !endTime)) {
    return {
      error: "Ange både starttid och sluttid, eller välj heldag.",
    };
  }

  if (!isAllDay && startTime >= endTime) {
    return { error: "Sluttiden måste vara efter starttiden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      error: `Kunde inte verifiera användaren: ${userError.message}`,
    };
  }

  if (!user) {
    return { error: "Du måste vara inloggad för att ändra händelser." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: `Kunde inte verifiera användarrollen: ${profileError.message}`,
    };
  }

  if (profile?.role !== "parent") {
    return { error: "Endast föräldrar får ändra händelser." };
  }

  const { data: updatedEvent, error: updateError } = await supabase
    .from("school_events")
    .update({
      title: trimmedTitle,
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
    return {
      error: `Kunde inte ändra händelsen: ${updateError.message}`,
    };
  }

  if (!updatedEvent) {
    return { error: "Händelsen hittades inte eller kunde inte ändras." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
