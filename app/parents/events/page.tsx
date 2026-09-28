"use client";

import { useState, type FormEvent } from "react";

import { extractEvents } from "@/app/actions/extractEvents";

export default function ParentEventsPage() {
  const [rawText, setRawText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { events } = await extractEvents(rawText);
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
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Extracting..." : "Extract Dates"}
        </button>
      </form>

      {successMessage && <p role="status">{successMessage}</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </main>
  );
}
