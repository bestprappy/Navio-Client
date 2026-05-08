"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";

import { DateRangePicker } from "@/components/date-range-picker";

type TripDatesProps = {
  initialFrom?: string;
  initialTo?: string;
};

function formatTripDate(date: Date): string {
  return format(date, "M/d");
}

export function TripDates({ initialFrom, initialTo }: TripDatesProps) {
  const parsedFrom = initialFrom ? new Date(initialFrom) : undefined;
  const parsedTo = initialTo ? new Date(initialTo) : undefined;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    parsedFrom ? { from: parsedFrom, to: parsedTo } : undefined,
  );
  const [showPicker, setShowPicker] = useState(!parsedFrom);

  function handleRangeChange(range: DateRange | undefined) {
    setDateRange(range);
    if (range?.from && range?.to) {
      setShowPicker(false);
    }
  }

  const fromLabel = dateRange?.from ? formatTripDate(dateRange.from) : null;
  const toLabel = dateRange?.to ? formatTripDate(dateRange.to) : null;
  const dateLabel =
    fromLabel && toLabel
      ? `${fromLabel} – ${toLabel}`
      : fromLabel
        ? `From ${fromLabel}`
        : null;

  if (showPicker) {
    return (
      <div className="mt-2">
        <DateRangePicker
          value={dateRange}
          onChange={handleRangeChange}
          startPlaceholder="Start date"
          endPlaceholder="End date"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowPicker(true)}
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
