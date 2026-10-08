"use client";

import { getISOWeek, getISOWeekYear } from "date-fns";
import { useState, type FormEvent } from "react";

import { extractEvents } from "@/app/actions/extractEvents";

function getCurrentIsoWeek() {
  const today = new Date();

  return `${getISOWeekYear(today)}-W${String(getISOWeek(today)).padStart(2, "0")}`;
}

export default function ExtractForm() {
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
        `${eventCount} ${eventCount === 1 ? "händelse har" : "händelser har"} sparats i databasen.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Det gick inte att extrahera datum från nyhetsbrevet.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-surface-dark bg-surface p-6 shadow-sm">
      <form onSubmit={handleSubmit}>
        <fieldset disabled={isLoading} className="m-0 border-0 p-0">
          <legend className="mb-3 font-medium text-text-muted">
            Nyhetsbrevets uppgifter
          </legend>
          <label
            htmlFor="newsletter-source"
            className="mb-1 block font-medium text-text-main"
          >
            Källa
          </label>
          <select
            id="newsletter-source"
            name="source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="mb-4 min-h-[44px] w-full rounded-xl border border-surface-dark bg-background px-4 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="School">Skola</option>
            <option value="Preschool">Förskola</option>
          </select>

          <label
            htmlFor="newsletter-week"
            className="mb-1 block font-medium text-text-main"
          >
            Nyhetsbrevets vecka
          </label>
          <input
            id="newsletter-week"
            name="week"
            type="week"
            value={week}
            onChange={(event) => setWeek(event.target.value)}
            className="mb-4 min-h-[44px] w-full rounded-xl border border-surface-dark bg-background px-4 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />

          <label
            htmlFor="newsletter-text"
            className="mb-1 block font-medium text-text-main"
          >
            Nyhetsbrevstext
          </label>
          <textarea
            id="newsletter-text"
            name="rawText"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            rows={16}
            className="min-h-[44px] w-full rounded-xl border border-surface-dark bg-background px-4 py-3 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />

          <button
            type="submit"
            className="mt-4 min-h-[44px] w-full rounded-xl bg-primary font-medium text-white hover:bg-primary-hover"
          >
            {isLoading ? "Extraherar..." : "Extrahera datum"}
          </button>
        </fieldset>
      </form>

      {successMessage && (
        <p role="status" className="mt-4 text-text-muted">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-4 text-text-muted">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
