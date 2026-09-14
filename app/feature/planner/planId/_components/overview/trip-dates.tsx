"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";

import { DateRangePicker } from "@/components/date-range-picker";
import { useTripDates } from "./use-trip-dates";

type TripDatesProps = {
  initialFrom?: string;
  initialTo?: string;
};

function formatTripDate(date: Date): string {
  return format(date, "M/d");
}

export function TripDates({ initialFrom, initialTo }: TripDatesProps) {
  const { pickerValue, changeRange, isPending, isError, isReady } = useTripDates(initialFrom, initialTo);
  const [isEditing, setIsEditing] = useState(!initialFrom);
  const parsedFrom = pickerValue?.from;
  const parsedTo = pickerValue?.to;

  const fromLabel = parsedFrom ? formatTripDate(parsedFrom) : null;
  const toLabel = parsedTo ? formatTripDate(parsedTo) : null;
  const dateLabel =
    fromLabel && toLabel
      ? `${fromLabel} – ${toLabel}`
      : fromLabel
        ? `From ${fromLabel}`
        : null;

  if (isEditing || !parsedFrom) {
    return (
      <div className="mt-2">
        <DateRangePicker
          value={pickerValue}
          onChange={(range) => changeRange(range, () => setIsEditing(false))}
          disabled={isPending || !isReady}
          startPlaceholder="Start date"
          endPlaceholder="End date"
        />
        {isPending && <p role="status" className="mt-2 text-xs text-muted-foreground">Saving dates...</p>}
        {isError && <p role="alert" className="mt-2 text-xs text-destructive">Dates could not be saved. Please select your dates again to retry.</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="mt-1 flex items-center gap-2 rounded-md py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={dateLabel ? `Change dates: ${dateLabel}` : "Add dates"}
    >
      <CalendarIcon className="size-3.5 shrink-0" aria-hidden="true" />
      {dateLabel ?? (
        <span className="flex items-center gap-1 text-muted-foreground/70">
          <Plus className="size-3" aria-hidden="true" />
          Add dates
        </span>
      )}
    </button>
  );
}
