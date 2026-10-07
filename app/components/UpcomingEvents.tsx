import { addDays, format, parseISO } from "date-fns";
import { sv } from "date-fns/locale/sv";
import { formatInTimeZone } from "date-fns-tz";

import CalendarSubscribeButton from "@/app/components/CalendarSubscribeButton";
import EventCard, { type SchoolEvent } from "@/app/components/EventCard";
import ProfileMenu from "@/app/components/ProfileMenu";
import { createClient } from "@/utils/supabase/server";

const stockholmTimeZone = "Europe/Stockholm";

export default async function UpcomingEvents() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Det gick inte att verifiera användaren: ${userError.message}`,
    );
  }

  let canEdit = false;
  let calendarToken: string | null = null;
  let initial = "E";
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, calendar_token, first_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        `Det gick inte att verifiera användarrollen: ${profileError.message}`,
      );
    }

    canEdit = profile?.role === "parent";
    calendarToken = profile?.calendar_token ?? null;
    initial = profile?.first_name
      ? profile.first_name.charAt(0).toUpperCase()
      : "E";
  }

  const { data: events, error } = await supabase
    .from("school_events")
    .select(
      "id, title, description, event_date, start_time, end_time, is_all_day, source",
    )
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(`Det gick inte att läsa in kommande händelser: ${error.message}`);
  }

  const today = parseISO(
    formatInTimeZone(new Date(), stockholmTimeZone, "yyyy-MM-dd"),
  );
  today.setHours(0, 0, 0, 0);

  const allEvents = (events ?? []) as SchoolEvent[];
  const upcomingEvents: SchoolEvent[] = [];
  const pastEvents: SchoolEvent[] = [];
  for (const event of allEvents) {
    const eventDate = parseISO(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    (eventDate >= today ? upcomingEvents : pastEvents).push(event);
  }

  function renderEvents(eventList: SchoolEvent[]) {
    return (
      <ul className="list-none p-0">
        {eventList.map((event) => (
          <li key={event.id}>
            <EventCard event={event} canEdit={canEdit} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      aria-labelledby="upcoming-events-heading"
      className="max-w-md mx-auto p-4"
    >
      <div className="flex w-full items-center justify-between mb-6">
        <h2
          id="upcoming-events-heading"
          className="text-lg font-bold text-text-main"
        >
          Kommande händelser
        </h2>
        <ProfileMenu initial={initial} />
      </div>
      {upcomingEvents.length === 0 ? (
        <p className="text-text-muted">Inga inplanerade händelser</p>
      ) : (
        renderEvents(upcomingEvents)
      )}
      {pastEvents.length > 0 && (
        <section aria-labelledby="past-events-heading">
          <h2
            id="past-events-heading"
            className="text-sm font-bold text-text-muted mt-8 mb-2"
          >
            Tidigare händelser
          </h2>
          <div className="opacity-60 grayscale">
            {renderEvents(pastEvents)}
          </div>
        </section>
      )}
      {calendarToken && (
        <div className="mt-8 flex justify-center pb-32">
          <CalendarSubscribeButton token={calendarToken} />
        </div>
      )}
      <a
        href="/parents/events"
        aria-label="Hantera händelser"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-lg hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:outline-none"
      >
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </a>
    </section>
  );
}
