"use client";

import {
  addWeeks,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeekYear,
} from "date-fns";
import { useState, type FormEvent } from "react";

import { extractEvents } from "@/app/actions/extractEvents";
import {
  DatePickerFormField,
  SelectFormField,
  TextAreaFormField,
} from "@/app/components/FormControls";

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
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSelectWeekDate(value: string) {
    const selectedWeek = getIsoWeekForDate(value);

    if (selectedWeek) {
      setWeek(selectedWeek);
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
          <SelectFormField
            id="newsletter-source"
            name="source"
            label="Källa"
            value={source}
            onChange={setSource}
            options={[
              { value: "School", label: "Skola" },
              { value: "Preschool", label: "Förskola" },
            ]}
            className="mb-4"
          />

          <DatePickerFormField
            id="newsletter-week"
            label="Nyhetsbrevets vecka"
            value={getDateForIsoWeek(week)}
            onChange={handleSelectWeekDate}
            isRequired
            description={`Vald vecka: ${week}`}
            className="mb-4"
          />
          <input type="hidden" name="week" value={week} />

          <TextAreaFormField
            id="newsletter-text"
            name="rawText"
            label="Nyhetsbrevstext"
            value={rawText}
            onChange={setRawText}
            rows={16}
            isRequired
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
