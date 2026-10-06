import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/utils/supabase/database.types";

const stockholmTimeZone = "Europe/Stockholm";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const pageSize = 1000;

type SchoolEvent = Pick<
  Database["public"]["Tables"]["school_events"]["Row"],
  | "id"
  | "title"
  | "description"
  | "event_date"
  | "start_time"
  | "end_time"
  | "is_all_day"
  | "source"
>;

function formatCalendarDate(date: string) {
  return format(parseISO(date), "yyyyMMdd");
}

function formatCalendarTime(date: string, time: string) {
  const localDateTime = fromZonedTime(
    `${date}T${time}`,
    stockholmTimeZone,
  );

  return formatInTimeZone(localDateTime, "UTC", "yyyyMMdd'T'HHmmss'Z'");
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function generateIcs(events: SchoolEvent[]) {
  const timestamp = formatInTimeZone(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ekis//SV",
  ];

  for (const event of events) {
    const description = [event.description, event.source]
      .filter((value): value is string => Boolean(value))
      .join("\n\n");

    calendarLines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}`,
      `DTSTAMP:${timestamp}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
    );

    if (!event.is_all_day && event.start_time) {
      calendarLines.push(
        `DTSTART:${formatCalendarTime(event.event_date, event.start_time)}`,
      );
      if (event.end_time) {
        calendarLines.push(
          `DTEND:${formatCalendarTime(event.event_date, event.end_time)}`,
        );
      }
    } else {
      calendarLines.push(
        `DTSTART;VALUE=DATE:${formatCalendarDate(event.event_date)}`,
        `DTEND;VALUE=DATE:${format(addDays(parseISO(event.event_date), 1), "yyyyMMdd")}`,
      );
    }

    calendarLines.push("END:VEVENT");
  }

  calendarLines.push("END:VCALENDAR");
  return calendarLines.join("\r\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!uuidPattern.test(token)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing Env Vars - URL:",
      !!supabaseUrl,
      "ServiceKey:",
      !!serviceRoleKey,
    );
    return new NextResponse("Calendar feed unavailable", { status: 500 });
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("calendar_token", token)
    .maybeSingle();

  if (profileError) {
    console.error("Supabase Profile Error:", profileError);
    return new NextResponse("Calendar feed unavailable", { status: 500 });
  }

  if (!profile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const events: SchoolEvent[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data: page, error: eventsError } = await supabase
      .from("school_events")
      .select(
        "id, title, description, event_date, start_time, end_time, is_all_day, source",
      )
      .order("event_date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (eventsError || !page) {
      console.error("Supabase Events Error:", eventsError);
      return new NextResponse("Calendar feed unavailable", { status: 500 });
    }

    events.push(...page);
    if (page.length < pageSize) {
      break;
    }
  }

  return new NextResponse(generateIcs(events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ekis-familj.ics"',
    },
  });
}
