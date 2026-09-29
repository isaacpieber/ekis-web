import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { createClient } from "@/utils/supabase/server";

const stockholmTimeZone = "Europe/Stockholm";

type SchoolEvent = {
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
  const localDateTime = fromZonedTime(
    `${date}T${time}`,
    stockholmTimeZone,
  );

  return formatInTimeZone(
    localDateTime,
    stockholmTimeZone,
    "yyyyMMdd'T'HHmmss",
  );
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function generateIcs(event: SchoolEvent) {
  const description = [event.description, event.source]
    .filter((value): value is string => Boolean(value))
    .join("\n\n");
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
  ];

  if (!event.is_all_day && event.start_time && event.end_time) {
    calendarLines.push(
      `DTSTART;TZID=Europe/Stockholm:${formatCalendarTime(event.event_date, event.start_time)}`,
      `DTEND;TZID=Europe/Stockholm:${formatCalendarTime(event.event_date, event.end_time)}`,
    );
  } else {
    calendarLines.push(
      `DTSTART;VALUE=DATE:${formatCalendarDate(event.event_date)}`,
      `DTEND;VALUE=DATE:${format(getNextDay(event.event_date), "yyyyMMdd")}`,
    );
  }

  calendarLines.push("END:VEVENT", "END:VCALENDAR");

  return calendarLines.join("\r\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("school_events")
    .select(
      "title, description, event_date, start_time, end_time, is_all_day, source",
    )
    .eq("id", id)
    .single();

  if (error || !event) {
    return new Response("Event not found.", { status: 404 });
  }

  return new Response(generateIcs(event as SchoolEvent), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="event.ics"',
    },
  });
}
