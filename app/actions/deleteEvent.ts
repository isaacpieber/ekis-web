"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

type DeleteEventResult = { success: true } | { error: string };

export async function deleteEvent(id: string): Promise<DeleteEventResult> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    return { error: "Ogiltigt händelse-ID." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: `Kunde inte verifiera användaren: ${userError.message}` };
  }

  if (!user) {
    return { error: "Du måste vara inloggad för att ta bort händelser." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return {
      error: `Kunde inte verifiera användarrollen: ${profileError.message}`,
    };
  }

  if (profile.role !== "parent") {
    return { error: "Endast föräldrar får ta bort händelser." };
  }

  const { data: deletedEvent, error: deleteError } = await supabase
    .from("school_events")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    return { error: `Kunde inte ta bort händelsen: ${deleteError.message}` };
  }

  if (!deletedEvent) {
    return { error: "Händelsen hittades inte eller kunde inte tas bort." };
  }

  revalidatePath("/");
  return { success: true };
}
