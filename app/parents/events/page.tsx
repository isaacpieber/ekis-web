"use client";

import { useState, type FormEvent } from "react";

import { extractEvents } from "@/app/actions/extractEvents";

function getCurrentIsoWeek() {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const day = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );

  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
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
    <main>
      <h1>Extract school events</h1>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={isLoading}>
          <legend>Newsletter details</legend>
          <label htmlFor="newsletter-source">Source</label>
          <select
            id="newsletter-source"
            name="source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="School">School</option>
            <option value="Preschool">Preschool</option>
          </select>

          <label htmlFor="newsletter-week">Newsletter Week</label>
          <input
            id="newsletter-week"
            name="week"
            type="week"
            value={week}
            onChange={(event) => setWeek(event.target.value)}
            required
          />

          <button type="submit">
            {isLoading ? "Extracting..." : "Extract Dates"}
          </button>
        </fieldset>

        <label htmlFor="newsletter-text">Newsletter text</label>
        <textarea
          id="newsletter-text"
          name="rawText"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          rows={16}
          required
          disabled={isLoading}
        />
      </form>

      {successMessage && <p role="status">{successMessage}</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </main>
  );
}
