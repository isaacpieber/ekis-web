import { addDays, format, parseISO } from "date-fns";
import { sv } from "date-fns/locale/sv";
import { formatInTimeZone } from "date-fns-tz";

import { createClient } from "@/utils/supabase/server";

const stockholmTimeZone = "Europe/Stockholm";
const sourceLabels: Record<string, string> = {
  School: "Skola",
  Preschool: "Förskola",
  Other: "Övrigt",
};

type SchoolEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean | null;
  source: string | null;
};

function formatCalendarDate(date: string) {
  return format(parseISO(date), "yyyyMMdd");
}

function getNextDay(date: string) {
  return addDays(parseISO(date), 1);
}

function formatCalendarTime(date: string, time: string) {
  return format(parseISO(`${date}T${time}`), "yyyyMMdd'T'HHmmss");
}

export function getGoogleCalendarUrl(event: SchoolEvent) {
  const url = new URL("https://calendar.google.com/calendar/render");
  const details = [event.description, event.source]
    .filter((value): value is string => Boolean(value))
    .join("\n\n");

  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("details", details);
  url.searchParams.set("ctz", "Europe/Stockholm");

  if (!event.is_all_day && event.start_time && event.end_time) {
    url.searchParams.set(
      "dates",
      `${formatCalendarTime(event.event_date, event.start_time)}/${formatCalendarTime(event.event_date, event.end_time)}`,
    );
  } else {
    url.searchParams.set(
      "dates",
      `${formatCalendarDate(event.event_date)}/${format(getNextDay(event.event_date), "yyyyMMdd")}`,
    );
  }

  return url.toString();
}

function formatDisplayDate(date: string) {
  return format(parseISO(date), "d MMMM yyyy", { locale: sv });
}

function formatDisplayTime(event: SchoolEvent) {
  if (event.is_all_day || !event.start_time || !event.end_time) {
    return null;
  }

  const startTime = format(
    parseISO(`1970-01-01T${event.start_time}`),
    "HH:mm",
  );
  const endTime = format(parseISO(`1970-01-01T${event.end_time}`), "HH:mm");

  return `${startTime}–${endTime}`;
}

export default async function UpcomingEvents() {
  const supabase = await createClient();
  const today = formatInTimeZone(new Date(), stockholmTimeZone, "yyyy-MM-dd");
  const { data: events, error } = await supabase
    .from("school_events")
    .select(
      "id, title, description, event_date, start_time, end_time, is_all_day, source",
    )
    .gte("event_date", today)
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(`Det gick inte att läsa in kommande händelser: ${error.message}`);
  }

  const upcomingEvents = (events ?? []) as SchoolEvent[];

  return (
    <section
      aria-labelledby="upcoming-events-heading"
      className="max-w-md mx-auto p-4"
    >
      <h2
        id="upcoming-events-heading"
        className="text-2xl font-bold text-text-main mb-4"
      >
        Kommande händelser
      </h2>
      {upcomingEvents.length === 0 ? (
        <p className="text-text-muted">Inga inplanerade händelser</p>
      ) : (
        <ul className="list-none p-0">
          {upcomingEvents.map((event) => {
            const time = formatDisplayTime(event);

            return (
              <li key={event.id}>
                <article className="bg-surface rounded-xl p-5 shadow-sm border border-surface-dark mb-4">
                  <h3 className="text-lg font-bold text-text-main mb-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-text-muted mb-4">
                    {formatDisplayDate(event.event_date)}
                    {time && <> · {time}</>}
                    {event.source && (
                      <> · {sourceLabels[event.source] ?? event.source}</>
                    )}
                  </p>
                  <a
                    href={`/api/events/${event.id}/calendar.ics`}
                    className="flex items-center justify-center w-full min-h-[44px] rounded-xl font-medium bg-primary text-white hover:bg-primary-hover mb-3"
                  >
                    Lägg till i Apple Kalender
                  </a>
                  <a
                    href={getGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center w-full min-h-[44px] rounded-xl font-medium bg-surface-dark text-text-main hover:opacity-80"
                  >
                    Lägg till i Google Kalender
                  </a>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
