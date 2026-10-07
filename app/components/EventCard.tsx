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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [isModalOpen]);

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
  const eventMetadata = (
    <>
      {formatDisplayDate(event.event_date)}
      {time && <> · {time}</>}
      {event.source && (
        <> · {sourceLabels[event.source] ?? event.source}</>
      )}
    </>
  );

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
        {hasDescription ? (
          <h3 className="min-w-0 flex-1 text-lg font-bold text-text-main">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setIsModalOpen(true)}
              className="flex min-h-11 min-w-11 w-full flex-col items-start justify-center rounded-xl text-left cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {event.title}
              <span className="text-sm font-normal text-text-muted">
                {eventMetadata}
              </span>
            </button>
          </h3>
        ) : (
          <h3 className="text-lg font-bold text-text-main">{event.title}</h3>
        )}
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
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="flex min-h-11 min-w-11 w-full items-center rounded-xl px-3 text-left font-medium text-text-main transition-colors hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
              >
                Visa
              </button>
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
      {!hasDescription && (
        <p className="mb-4 text-sm text-text-muted">{eventMetadata}</p>
      )}
      {isModalOpen && (
        <dialog
          ref={dialogRef}
          aria-labelledby={`event-dialog-title-${event.id}`}
          aria-modal="true"
          onCancel={(event) => {
            event.preventDefault();
            setIsModalOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsModalOpen(false);
            }
          }}
          className="fixed inset-0 m-0 flex h-full w-full max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0 backdrop:bg-text-main/50 sm:items-center sm:p-4"
        >
          <div className="max-h-screen w-full overflow-y-auto rounded-t-xl bg-surface p-6 pb-8 shadow-2xl sm:max-w-md sm:rounded-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id={`event-dialog-title-${event.id}`}
                className="min-w-0 flex-1 text-xl font-bold text-text-main"
              >
                {event.title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-surface-dark text-text-muted hover:text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
                aria-label="Stäng"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-sm font-medium text-text-muted">
              {eventMetadata}
            </p>
            {hasDescription ? (
              <div className="text-base leading-relaxed whitespace-pre-wrap text-text-main">
                {event.description}
              </div>
            ) : (
              <p className="text-sm italic text-text-muted">
                Ingen ytterligare beskrivning.
              </p>
            )}
          </div>
        </dialog>
      )}
    </article>
  );
}
