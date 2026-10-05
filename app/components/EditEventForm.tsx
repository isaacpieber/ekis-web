"use client";

import { updateEvent } from "@/app/actions/updateEvent";
import type { SchoolEvent } from "@/app/components/EventCard";

export default function EditEventForm({ event }: { event: SchoolEvent }) {
  return (
    <form
      action={updateEvent.bind(null, event.id)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="font-medium text-text-main">
          Titel
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={event.title}
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="font-medium text-text-main">
          Beskrivning
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={event.description ?? ""}
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="event_date" className="font-medium text-text-main">
          Datum
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          required
          defaultValue={event.event_date}
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="start_time" className="font-medium text-text-main">
            Starttid
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={event.start_time?.slice(0, 5) ?? ""}
            className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="end_time" className="font-medium text-text-main">
            Sluttid
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            defaultValue={event.end_time?.slice(0, 5) ?? ""}
            className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      <label className="flex min-h-[44px] items-center gap-3 font-medium text-text-main">
        <input
          name="is_all_day"
          type="checkbox"
          defaultChecked={event.is_all_day ?? false}
          className="min-h-[44px] min-w-[44px] accent-primary focus:ring-2 focus:ring-primary focus:outline-none"
        />
        Heldag
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="source" className="font-medium text-text-main">
          Källa
        </label>
        <select
          id="source"
          name="source"
          defaultValue={event.source ?? ""}
          className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-surface p-3 text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
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
        className="min-h-[44px] min-w-[44px] rounded-xl bg-primary px-4 font-medium text-surface hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:outline-none"
      >
        Spara ändringar
      </button>
    </form>
  );
}
