import { notFound } from "next/navigation";

import EditEventForm from "@/app/components/EditEventForm";
import { createClient } from "@/utils/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) {
    notFound();
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
    notFound();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Kunde inte verifiera användarrollen: ${profileError.message}`,
    );
  }

  if (profile?.role !== "parent") {
    notFound();
  }

  const { data: event, error } = await supabase
    .from("school_events")
    .select(
      "id, title, description, event_date, start_time, end_time, is_all_day, source",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Kunde inte läsa in händelsen: ${error.message}`);
  }

  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold text-text-main">
        Ändra händelse
      </h1>
      <EditEventForm event={event} />
    </main>
  );
}
