"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale/sv";
import Link from "next/link";

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

export default function EventCard({
  event,
  canEdit,
}: {
  event: SchoolEvent;
  canEdit: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasDescription = Boolean(
    event.description && event.description.trim() !== "",
  );

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
        const result = await deleteEvent(event.id);
        if ("error" in result) {
          setDeleteError(result.error);
        }
      } catch {
        setDeleteError(
          "Det gick inte att ta bort händelsen. Försök igen.",
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
        <h3 className="text-lg font-bold text-text-main">
          {hasDescription ? (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={`event-description-${event.id}`}
              onClick={() => setIsExpanded((expanded) => !expanded)}
              className="flex min-h-11 min-w-11 items-center rounded-xl text-left focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <span>{event.title}</span>
                <svg
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-text-muted transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
          ) : (
            event.title
          )}
        </h3>
        <div
          ref={menuRef}
          onClick={(event) => event.stopPropagation()}
          className="relative shrink-0"
        >
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
              {canEdit && (
                <Link
                  href={`/parents/events/${event.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-text-main hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  Ändra
                </Link>
              )}
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
      {hasDescription && (
        <div
          id={`event-description-${event.id}`}
          hidden={!isExpanded}
          className="mt-3 border-t border-surface-dark pt-3 text-sm whitespace-pre-wrap text-text-muted"
        >
          {event.description}
        </div>
      )}
    </article>
  );
}
