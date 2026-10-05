"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale/sv";

import { deleteEvent } from "@/app/actions/deleteEvent";

const sourceLabels: Record<string, string> = {
  School: "Skola",
  Preschool: "Förskola",
  Other: "Övrigt",
};

export type SchoolEvent = {
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
  return date.replace(/-/g, "");
}

function getNextDay(date: string) {
  const nextDay = new Date(`${date}T00:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return nextDay.toISOString().slice(0, 10).replace(/-/g, "");
}

function formatCalendarTime(date: string, time: string) {
  const [hour, minute, seconds = "00"] = time.split(":");
  return `${formatCalendarDate(date)}T${hour}${minute}${seconds.slice(0, 2)}`;
}

function getGoogleCalendarUrl(event: SchoolEvent) {
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
      `${formatCalendarDate(event.event_date)}/${getNextDay(event.event_date)}`,
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

  const startTime = format(parseISO(`1970-01-01T${event.start_time}`), "HH:mm");
  const endTime = format(parseISO(`1970-01-01T${event.end_time}`), "HH:mm");

  return `${startTime}–${endTime}`;
}

export default function EventCard({ event }: { event: SchoolEvent }) {
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const googleCalendarUrl = getGoogleCalendarUrl(event);
  const calendarUrl = `/api/events/${event.id}/calendar.ics`;
  const primaryCalendarLabel = isAppleDevice
    ? "Lägg till i Apple Kalender"
    : "Lägg till i Google Kalender";
  const alternativeCalendarLabel = isAppleDevice
    ? "Lägg till i Google Kalender"
    : "Lägg till i Apple Kalender";

  useEffect(() => {
    setIsAppleDevice(/iPhone|iPad|iPod|Mac/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleDelete() {
    setIsMenuOpen(false);
    setDeleteError(null);

    if (
      !window.confirm(
        "Är du säker på att du vill ta bort den här händelsen?",
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteEvent(event.id);
      } catch (error) {
        setDeleteError(
          error instanceof Error
            ? error.message
            : "Det gick inte att ta bort händelsen.",
        );
      }
    });
  }

  const time = formatDisplayTime(event);

  return (
    <article className="relative mb-4 rounded-xl border border-surface-dark bg-surface p-5 shadow-sm">
      {isPending && (
        <p role="status" className="mb-2 text-sm text-text-muted">
          Tar bort...
        </p>
      )}
      {deleteError && (
        <p role="alert" className="mb-2 text-sm text-text-muted">
          {deleteError}
        </p>
      )}
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-text-main">{event.title}</h3>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label={`Alternativ för ${event.title}`}
            aria-expanded={isMenuOpen}
            aria-controls={`event-menu-${event.id}`}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-text-main hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="5" cy="12" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="19" cy="12" r="1.75" />
            </svg>
          </button>
          {isMenuOpen && (
            <div
              id={`event-menu-${event.id}`}
              className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-surface-dark bg-surface p-1 shadow-md"
            >
              {isAppleDevice ? (
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm text-text-main hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {alternativeCalendarLabel}
                </a>
              ) : (
                <a
                  href={calendarUrl}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm text-text-main hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {alternativeCalendarLabel}
                </a>
              )}
              <button
                type="button"
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-text-main hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
              >
                Ändra
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-text-main hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {isPending ? "Tar bort..." : "Ta bort"}
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mb-4 text-sm text-text-muted">
        {formatDisplayDate(event.event_date)}
        {time && <> · {time}</>}
        {event.source && (
          <> · {sourceLabels[event.source] ?? event.source}</>
        )}
      </p>
      <div className="flex justify-end">
        <a
          href={isAppleDevice ? calendarUrl : googleCalendarUrl}
          target={isAppleDevice ? undefined : "_blank"}
          rel={isAppleDevice ? undefined : "noreferrer"}
          aria-label={primaryCalendarLabel}
          className="flex h-12 w-12 min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary text-surface hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
        </a>
      </div>
    </article>
  );
}
