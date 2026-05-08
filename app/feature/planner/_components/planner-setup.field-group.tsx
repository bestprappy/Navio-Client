"use client";

import { useId } from "react";
import { useAtom, useAtomValue } from "jotai";

import { DateRangePicker } from "@/components/date-range-picker";

import { DestinationSearch } from "./destination-search";
import {
  destinationValidationErrorAtom,
  plannerDateRangeAtom,
} from "./planner-setup.atoms";

type PlannerSetupFieldGroupProps = {
  label: string;
  placeholder?: string;
  hint?: string;
  type?: "text" | "date-range";
  startPlaceholder?: string;
  endPlaceholder?: string;
};

export function PlannerSetupFieldGroup({
  label,
  placeholder,
  hint,
  type = "text",
  startPlaceholder,
  endPlaceholder,
}: PlannerSetupFieldGroupProps) {
  const labelId = useId();
  const destinationInputId = useId();
  const destinationErrorId = `${destinationInputId}-error`;
  const destinationError = useAtomValue(destinationValidationErrorAtom);
  const [dateRange, setDateRange] = useAtom(plannerDateRangeAtom);

  if (type === "date-range") {
    return (
      <section
        role="group"
        aria-labelledby={labelId}
        className="rounded-md border border-border bg-card px-5 py-4"
      >
        <div
          id={labelId}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </div>
        <div className="mt-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            startPlaceholder={startPlaceholder}
            endPlaceholder={endPlaceholder}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-border bg-card px-5 py-4">
      <label
        htmlFor={destinationInputId}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <div className="mt-4">
        <DestinationSearch inputId={destinationInputId}>
          <DestinationSearch.Input
            aria-label={hint ?? label}
            errorMessageId={destinationErrorId}
            placeholder={placeholder}
          />
          <DestinationSearch.Listbox />
        </DestinationSearch>
      </div>
      {destinationError ? (
        <p id={destinationErrorId} className="mt-3 text-sm text-destructive">
          {destinationError}
        </p>
      ) : null}
    </section>
  );
}
