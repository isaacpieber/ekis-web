"use client";

import { useActionState, useState } from "react";
import { Checkbox } from "react-aria-components";

import { updateEvent } from "@/app/actions/updateEvent";
import type { SchoolEvent } from "@/app/components/EventCard";
import {
  DatePickerFormField,
  SelectFormField,
  TextAreaFormField,
  TextFormField,
  TimeFormField,
} from "@/app/components/FormControls";

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
      <TextFormField
        id="title"
        name="title"
        label="Titel"
        value={fields.title}
        onChange={(value) =>
          setFields((current) => ({
            ...current,
            title: value,
          }))
        }
        isRequired
      />

      <TextAreaFormField
        id="description"
        name="description"
        label="Beskrivning"
        rows={4}
        value={fields.description}
        onChange={(value) =>
          setFields((current) => ({
            ...current,
            description: value,
          }))
        }
      />

      <DatePickerFormField
        id="event_date"
        label="Datum"
        value={fields.event_date}
        onChange={(value) =>
          setFields((current) => ({
            ...current,
            event_date: value,
          }))
        }
        isRequired
      />
      <input type="hidden" name="event_date" value={fields.event_date} />

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <TimeFormField
          id="start_time"
          label="Starttid"
          value={fields.start_time}
          isDisabled={fields.is_all_day}
          onChange={(value) =>
            setFields((current) => ({
              ...current,
              start_time: value,
              ...(value ? { is_all_day: false } : {}),
            }))
          }
        />

        <TimeFormField
          id="end_time"
          label="Sluttid"
          value={fields.end_time}
          isDisabled={fields.is_all_day}
          onChange={(value) =>
            setFields((current) => ({
              ...current,
              end_time: value,
              ...(value ? { is_all_day: false } : {}),
            }))
          }
        />
      </div>
      <input type="hidden" name="start_time" value={fields.start_time} />
      <input type="hidden" name="end_time" value={fields.end_time} />

      <Checkbox
        name="is_all_day"
        isSelected={fields.is_all_day}
        onChange={(isSelected) =>
          setFields((current) =>
            isSelected
              ? {
                  ...current,
                  is_all_day: true,
                  start_time: "",
                  end_time: "",
                }
              : { ...current, is_all_day: false },
          )
        }
        className="group flex min-h-[44px] min-w-0 items-center gap-3 font-medium text-text-main focus-within:ring-2 focus-within:ring-primary"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-surface-dark bg-surface group-data-[selected]:border-primary group-data-[selected]:bg-primary">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 text-white opacity-0 group-data-[selected]:opacity-100"
          >
            <path d="m3 8 3.2 3.2L13 4.5" />
          </svg>
        </span>
        Heldag
      </Checkbox>

      <SelectFormField
        id="source"
        name="source"
        label="Källa"
        value={fields.source}
        onChange={(value) =>
          setFields((current) => ({
            ...current,
            source: value,
          }))
        }
        options={[
          { value: "", label: "Ingen källa" },
          ...(event.source &&
          !["School", "Preschool", "Other"].includes(event.source)
            ? [{ value: event.source, label: event.source }]
            : []),
          { value: "School", label: "Skola" },
          { value: "Preschool", label: "Förskola" },
          { value: "Other", label: "Övrigt" },
        ]}
      />

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
