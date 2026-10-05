"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export async function deleteEvent(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    throw new Error("Ogiltigt händelse-ID.");
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
    throw new Error("Du måste vara inloggad för att ta bort händelser.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(`Kunde inte verifiera användarrollen: ${profileError.message}`);
  }

  if (profile.role !== "parent") {
    throw new Error("Endast föräldrar får ta bort händelser.");
  }

  const { data: deletedEvent, error: deleteError } = await supabase
    .from("school_events")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    throw new Error(`Kunde inte ta bort händelsen: ${deleteError.message}`);
  }

  if (!deletedEvent) {
    throw new Error("Händelsen hittades inte eller kunde inte tas bort.");
  }

  revalidatePath("/", "layout");
}
