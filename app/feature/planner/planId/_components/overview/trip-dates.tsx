"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { useAtom } from "jotai";

import { DateRangePicker } from "@/components/date-range-picker";
import { tripDateRangeAtom } from "./trip-builder.atoms";

type TripDatesProps = {
  initialFrom?: string;
  initialTo?: string;
};

function formatTripDate(date: Date): string {
  return format(date, "M/d");
}

export function TripDates({ initialFrom, initialTo }: TripDatesProps) {
  const [dateRange, setDateRange] = useAtom(tripDateRangeAtom);
  // only show the picker inline when actively editing (no dates yet, or user clicked to change)
  const [isEditing, setIsEditing] = useState(!initialFrom);

  useEffect(() => {
    if (initialFrom) {
      setDateRange({ from: initialFrom, to: initialTo });
    }
    // seed on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsedFrom = dateRange.from ? new Date(dateRange.from) : undefined;
  const parsedTo = dateRange.to ? new Date(dateRange.to) : undefined;

  const pickerValue: DateRange | undefined = parsedFrom
    ? { from: parsedFrom, to: parsedTo }
    : undefined;

  function handleRangeChange(range: DateRange | undefined) {
    setDateRange({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
    });
    // only close once the user has picked BOTH ends of the range
    if (range?.from && range?.to) {
      setIsEditing(false);
    }
  }

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
