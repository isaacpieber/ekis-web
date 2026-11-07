"use client";

import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  Button,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Input,
  I18nProvider,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
  TextArea,
  TextField,
  TimeField,
} from "react-aria-components";
import { parseDate, parseTime } from "@internationalized/date";

const labelClassName = "font-medium text-text-main";
const controlClassName =
  "box-border min-h-[44px] w-full min-w-0 rounded-xl border border-surface-dark bg-background px-4 text-base text-text-main focus:ring-2 focus:ring-primary focus:outline-none";
const segmentedInputClassName =
  "flex min-h-[44px] min-w-0 flex-1 items-center gap-1 px-4 py-2 text-base text-text-main";

type FieldProps = {
  id: string;
  label: string;
  className?: string;
};

type TextFormFieldProps = FieldProps & {
  name: string;
  type?: "text" | "password";
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  autoComplete?: string;
};

export function TextFormField({
  id,
  label,
  name,
  type = "text",
  value,
  onChange,
  isRequired,
  isDisabled,
  autoComplete,
  className = "",
}: TextFormFieldProps) {
  return (
    <TextField
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      autoComplete={autoComplete}
      className={`flex min-w-0 flex-col gap-1 ${className}`}
    >
      <Label className={labelClassName}>{label}</Label>
      <Input className={controlClassName} />
    </TextField>
  );
}

type TextAreaFormFieldProps = FieldProps & {
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  isRequired?: boolean;
};

export function TextAreaFormField({
  id,
  label,
  name,
  value,
  onChange,
  rows = 4,
  isRequired,
  className = "",
}: TextAreaFormFieldProps) {
  return (
    <TextField
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      className={`flex min-w-0 flex-col gap-1 ${className}`}
    >
      <Label className={labelClassName}>{label}</Label>
      <TextArea
        rows={rows}
        className={`${controlClassName} py-3`}
      />
    </TextField>
  );
}

type SelectOption = {
  value: string;
  label: string;
};

type SelectFormFieldProps = FieldProps & {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
};

export function SelectFormField({
  id,
  label,
  name,
  value,
  onChange,
  options,
  className = "",
}: SelectFormFieldProps) {
  const selectedIndex = options.findIndex((option) => option.value === value);

  return (
    <Select
      id={id}
      name={name}
      selectedKey={selectedIndex >= 0 ? `option-${selectedIndex}` : null}
      onSelectionChange={(key) => {
        const selectedOption = options.find(
          (_, index) => `option-${index}` === key?.toString(),
        );
        onChange(selectedOption?.value ?? "");
      }}
      className={`flex min-w-0 flex-col gap-1 ${className}`}
    >
      <Label className={labelClassName}>{label}</Label>
      <Button
        className={`${controlClassName} flex items-center justify-between gap-3 text-left`}
      >
        <SelectValue className="min-w-0 flex-1 truncate" />
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5 shrink-0"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </Button>
      <Popover className="z-50 rounded-xl border border-surface-dark bg-surface p-1 shadow-lg">
        <ListBox className="max-h-60 overflow-auto outline-none">
          {options.map((option, index) => (
            <ListBoxItem
              key={option.value}
              id={`option-${index}`}
              textValue={option.label}
              className="flex min-h-[44px] cursor-pointer items-center rounded-xl px-3 py-2 text-text-main outline-none data-[focused]:bg-background data-[selected]:bg-primary data-[selected]:text-white"
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}

type DatePickerFormFieldProps = FieldProps & {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  description?: string;
};

export function DatePickerFormField({
  id,
  label,
  value,
  onChange,
  isRequired,
  description,
  className = "",
}: DatePickerFormFieldProps) {
  return (
    <I18nProvider locale="sv-SE">
      <DatePicker
        id={id}
        value={parseDate(value)}
        onChange={(date) => {
          if (date) {
            onChange(date.toString());
          }
        }}
        isRequired={isRequired}
        className={`flex min-w-0 flex-col gap-1 ${className}`}
      >
        <Label className={labelClassName}>{label}</Label>
        <Group className="flex min-w-0 items-center rounded-xl border border-surface-dark bg-background focus-within:ring-2 focus-within:ring-primary">
          <DateInput className={segmentedInputClassName}>
            {(segment) => (
              <DateSegment
                segment={segment}
                className="rounded px-0.5 text-text-main focus:bg-primary focus:text-white focus:outline-none"
              />
            )}
          </DateInput>
          <Button
            aria-label={`Öppna kalender för ${label.toLowerCase()}`}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-primary focus:ring-2 focus:ring-primary focus:outline-none"
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
          </Button>
        </Group>
        {description && (
          <Text slot="description" className="text-sm text-text-muted">
            {description}
          </Text>
        )}
        <Popover className="z-50 rounded-xl border border-surface-dark bg-surface p-1 shadow-lg">
          <Dialog className="outline-none">
            <Calendar>
              <header className="mb-2 flex items-center justify-between gap-2">
                <Button
                  slot="previous"
                  aria-label="Föregående månad"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path d="m12 4-6 6 6 6" />
                  </svg>
                </Button>
                <Heading className="text-center font-medium text-text-main" />
                <Button
                  slot="next"
                  aria-label="Nästa månad"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path d="m8 4 6 6-6 6" />
                  </svg>
                </Button>
              </header>
              <CalendarGrid
                weekdayStyle="short"
                className="border-separate border-spacing-0"
              >
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="h-11 min-w-[44px] rounded-xl text-center text-text-main outline-none hover:bg-background focus:bg-primary focus:text-white data-[outside-month]:text-text-muted data-[selected]:bg-primary data-[selected]:text-white"
                  />
                )}
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </Popover>
      </DatePicker>
    </I18nProvider>
  );
}

type TimeFormFieldProps = FieldProps & {
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
};

export function TimeFormField({
  id,
  label,
  value,
  onChange,
  isDisabled,
  className = "",
}: TimeFormFieldProps) {
  return (
    <I18nProvider locale="sv-SE">
      <TimeField
        id={id}
        value={value ? parseTime(value) : null}
        onChange={(time) => onChange(time?.toString().slice(0, 5) ?? "")}
        isDisabled={isDisabled}
        granularity="minute"
        hourCycle={24}
        className={`flex min-w-0 flex-col gap-1 ${className}`}
      >
        <Label className={labelClassName}>{label}</Label>
        <Group className="flex min-w-0 items-center rounded-xl border border-surface-dark bg-background focus-within:ring-2 focus-within:ring-primary">
          <DateInput className={segmentedInputClassName}>
            {(segment) => (
              <DateSegment
                segment={segment}
                className="rounded px-0.5 text-text-main focus:bg-primary focus:text-white focus:outline-none"
              />
            )}
          </DateInput>
        </Group>
      </TimeField>
    </I18nProvider>
  );
}
