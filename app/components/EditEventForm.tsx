"use client";

import { useActionState, useState } from "react";

import { updateEvent } from "@/app/actions/updateEvent";
import type { SchoolEvent } from "@/app/components/EventCard";

export default function EditEventForm({ event }: { event: SchoolEvent }) {
  const [fields, setFields] = useState(() => {
    const startTime = event.start_time?.slice(0, 5) ?? "";
    const endTime = event.end_time?.slice(0, 5) ?? "";

    return {
      title: event.title,
      description: event.description ?? "",
      event_date: event.event_date,
      start_time: startTime,
      end_time: endTime,
      is_all_day: Boolean(event.is_all_day) && !startTime && !endTime,
      source: event.source ?? "",
    };
  });
  const [state, formAction, isPending] = useActionState(
    updateEvent.bind(null, event.id),
    { error: null },
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
    >
      {state.error && (
        <p role="alert" className="text-text-muted">
          {state.error}
        </p>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="title" className="font-medium text-text-main">
          Titel
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={fields.title}
          onChange={(inputEvent) =>
            setFields((current) => ({
              ...current,
              title: inputEvent.target.value,
            }))
          }
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="description" className="font-medium text-text-main">
          Beskrivning
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={fields.description}
          onChange={(inputEvent) =>
            setFields((current) => ({
              ...current,
              description: inputEvent.target.value,
            }))
          }
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="event_date" className="font-medium text-text-main">
          Datum
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          required
          value={fields.event_date}
          onChange={(inputEvent) =>
            setFields((current) => ({
              ...current,
              event_date: inputEvent.target.value,
            }))
          }
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="start_time" className="font-medium text-text-main">
            Starttid
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            value={fields.start_time}
            disabled={fields.is_all_day}
            onChange={(inputEvent) =>
              setFields((current) => ({
                ...current,
                start_time: inputEvent.target.value,
                ...(inputEvent.target.value ? { is_all_day: false } : {}),
              }))
            }
            className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="end_time" className="font-medium text-text-main">
            Sluttid
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            value={fields.end_time}
            disabled={fields.is_all_day}
            onChange={(inputEvent) =>
              setFields((current) => ({
                ...current,
                end_time: inputEvent.target.value,
                ...(inputEvent.target.value ? { is_all_day: false } : {}),
              }))
            }
            className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <label className="flex min-h-[44px] min-w-0 items-center gap-3 font-medium text-text-main">
        <input
          name="is_all_day"
          type="checkbox"
          checked={fields.is_all_day}
          onChange={(inputEvent) =>
            setFields((current) =>
              inputEvent.target.checked
                ? {
                    ...current,
                    is_all_day: true,
                    start_time: "",
                    end_time: "",
                  }
                : { ...current, is_all_day: false },
            )
          }
          className="min-h-[44px] min-w-[44px] accent-primary focus:ring-2 focus:ring-primary focus:outline-none"
        />
        Heldag
      </label>
      {fields.is_all_day && (
        <>
          <input type="hidden" name="start_time" value={fields.start_time} />
          <input type="hidden" name="end_time" value={fields.end_time} />
        </>
      )}

      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="source" className="font-medium text-text-main">
          Källa
        </label>
        <select
          id="source"
          name="source"
          value={fields.source}
          onChange={(inputEvent) =>
            setFields((current) => ({
              ...current,
              source: inputEvent.target.value,
            }))
          }
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <option value="">Ingen källa</option>
          {event.source &&
            !["School", "Preschool", "Other"].includes(event.source) && (
              <option value={event.source}>{event.source}</option>
            )}
          <option value="School">Skola</option>
          <option value="Preschool">Förskola</option>
          <option value="Other">Övrigt</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[44px] min-w-[44px] rounded-xl bg-primary px-4 font-medium text-surface hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:outline-none"
      >
        {isPending ? "Sparar..." : "Spara ändringar"}
      </button>
    </form>
  );
}
