import { createClient } from "@/utils/supabase/server";

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
  return date.replaceAll("-", "");
}

function getNextDay(date: string) {
  const nextDay = new Date(`${date}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  return nextDay.toISOString().split("T")[0];
}

function formatCalendarTime(date: string, time: string) {
  const [hours, minutes] = time.split(":");
  return `${formatCalendarDate(date)}T${hours}${minutes}00`;
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
      `${formatCalendarDate(event.event_date)}/${formatCalendarDate(getNextDay(event.event_date))}`,
    );
  }

  return url.toString();
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatDisplayTime(event: SchoolEvent) {
  if (event.is_all_day || !event.start_time || !event.end_time) {
    return null;
  }

  return `${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)}`;
}

export default async function UpcomingEvents() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: events, error } = await supabase
    .from("school_events")
    .select(
      "id, title, description, event_date, start_time, end_time, is_all_day, source",
    )
    .gte("event_date", today)
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(`Unable to load upcoming events: ${error.message}`);
  }

  const upcomingEvents = (events ?? []) as SchoolEvent[];

  return (
    <section aria-labelledby="upcoming-events-heading">
      <h2 id="upcoming-events-heading">Upcoming events</h2>
      {upcomingEvents.length === 0 ? (
        <p>No upcoming school events.</p>
      ) : (
        <ul>
          {upcomingEvents.map((event) => {
            const time = formatDisplayTime(event);

            return (
              <li key={event.id}>
                <article>
                  <h3>{event.title}</h3>
                  <p>{formatDisplayDate(event.event_date)}</p>
                  {time && <p>{time}</p>}
                  {event.source && <p>{event.source}</p>}
                  <a
                    href={getGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    role="button"
                  >
                    Add to Google Calendar
                  </a>
                  <a
                    href={`/api/events/${event.id}/calendar.ics`}
                    download="event.ics"
                  >
                    Add to Apple Calendar
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
