"use client";

import {
  addWeeks,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeekYear,
} from "date-fns";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { extractEvents } from "@/app/actions/extractEvents";

function getCurrentIsoWeek() {
  const today = new Date();

  return `${getISOWeekYear(today)}-W${String(getISOWeek(today)).padStart(2, "0")}`;
}

function getDateForIsoWeek(week: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);

  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const weekNumber = Number(match[2]);
  const januaryFourth = new Date(0);
  januaryFourth.setFullYear(year, 0, 4);
  januaryFourth.setHours(12, 0, 0, 0);

  if (weekNumber < 1 || weekNumber > 53) {
    return "";
  }

  const date = addWeeks(
    startOfISOWeekYear(januaryFourth),
    weekNumber - 1,
  );

  if (getISOWeekYear(date) !== year || getISOWeek(date) !== weekNumber) {
    return "";
  }

  return format(date, "yyyy-MM-dd");
}

function getIsoWeekForDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export default function ExtractForm() {
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState("School");
  const [week, setWeek] = useState(getCurrentIsoWeek);
  const [supportsWeekInput, setSupportsWeekInput] = useState<boolean | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = document.createElement("input");
    input.type = "week";
    setSupportsWeekInput(input.type === "week");
  }, []);

  function handleSelectWeekDate(value: string) {
    const selectedWeek = getIsoWeekForDate(value);

    if (selectedWeek) {
      setWeek(selectedWeek);
    }
  }

  function openDatePicker() {
    const datePicker = datePickerRef.current;

    if (!datePicker) {
      return;
    }

    if (typeof datePicker.showPicker === "function") {
      datePicker.showPicker();
    } else {
      datePicker.click();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await extractEvents(rawText, week, source);

      setRawText("");
      setSuccessMessage(
        "Extraktionen har lagts i kö och bearbetas i bakgrunden. Händelserna visas i kalendern när de är klara.",
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
        <fieldset disabled={isLoading} className="m-0 min-w-0 border-0 p-0">
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
          <div className="relative mb-4 min-w-0">
            <input
              id="newsletter-week"
              name="week"
              type="week"
              value={week}
              onChange={(event) => setWeek(event.target.value)}
              className={`box-border min-h-[44px] w-full min-w-0 max-w-full rounded-xl border border-surface-dark bg-background px-4 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none ${
                supportsWeekInput === false ? "pr-12" : ""
              }`}
              required
            />
            {supportsWeekInput === false && (
              <>
                <input
                  ref={datePickerRef}
                  type="date"
                  value={getDateForIsoWeek(week)}
                  onChange={(event) => handleSelectWeekDate(event.target.value)}
                  className="sr-only"
                  aria-label="Välj ett datum i nyhetsbrevets vecka"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                  aria-label="Välj vecka med kalender"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <rect x="3.75" y="5.75" width="16.5" height="14.5" rx="2" />
                    <path d="M7.75 3.75v4M16.25 3.75v4M3.75 10h16.5" />
                  </svg>
                </button>
              </>
            )}
          </div>

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
            {isLoading ? "Lägger i kö..." : "Extrahera datum"}
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
