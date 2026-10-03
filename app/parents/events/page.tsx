"use client";

import { getISOWeek, getISOWeekYear } from "date-fns";
import { useState, type FormEvent } from "react";

import { extractEvents } from "@/app/actions/extractEvents";

function getCurrentIsoWeek() {
  const today = new Date();

  return `${getISOWeekYear(today)}-W${String(getISOWeek(today)).padStart(2, "0")}`;
}

export default function ParentEventsPage() {
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState("School");
  const [week, setWeek] = useState(getCurrentIsoWeek);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { events } = await extractEvents(rawText, week, source);
      const eventCount = events.length;

      setRawText("");
      setSuccessMessage(
        `${eventCount} ${eventCount === 1 ? "event" : "events"} saved to the database.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to extract dates from the newsletter.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <section className="bg-surface rounded-xl p-6 shadow-sm border border-surface-dark">
        <h1 className="text-text-main font-bold text-2xl mb-6">
          Extract school events
        </h1>
        <form onSubmit={handleSubmit}>
          <fieldset
            disabled={isLoading}
            className="border-0 p-0 m-0"
          >
            <legend className="text-text-muted font-medium mb-3">
              Newsletter details
            </legend>
            <label
              htmlFor="newsletter-source"
              className="block text-text-main font-medium mb-1"
            >
              Source
            </label>
            <select
              id="newsletter-source"
              name="source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="min-h-[44px] rounded-xl border border-surface-dark bg-background px-4 text-text-main focus:ring-2 focus:ring-primary focus:outline-none w-full mb-4"
            >
              <option value="School">School</option>
              <option value="Preschool">Preschool</option>
            </select>

            <label
              htmlFor="newsletter-week"
              className="block text-text-main font-medium mb-1"
            >
              Newsletter Week
            </label>
            <input
              id="newsletter-week"
              name="week"
              type="week"
              value={week}
              onChange={(event) => setWeek(event.target.value)}
              className="min-h-[44px] rounded-xl border border-surface-dark bg-background px-4 text-text-main focus:ring-2 focus:ring-primary focus:outline-none w-full mb-4"
              required
            />

            <label
              htmlFor="newsletter-text"
              className="block text-text-main font-medium mb-1"
            >
              Newsletter text
            </label>
            <textarea
              id="newsletter-text"
              name="rawText"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={16}
              className="min-h-[44px] rounded-xl border border-surface-dark bg-background px-4 text-text-main focus:ring-2 focus:ring-primary focus:outline-none w-full py-3"
              required
            />

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-primary text-white hover:bg-primary-hover font-medium mt-4"
            >
              {isLoading ? "Extracting..." : "Extract Dates"}
            </button>
          </fieldset>
        </form>

        {successMessage && (
          <p role="status" className="text-text-muted mt-4">
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="text-text-muted mt-4">
            {errorMessage}
          </p>
        )}
      </section>
    </main>
  );
}
