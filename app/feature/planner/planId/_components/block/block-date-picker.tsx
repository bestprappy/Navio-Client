"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type BlockDatePickerProps = {
  date: string;
  from?: string;
  to?: string;
  onDateChange: (date: string) => void;
};

export function BlockDatePicker({
  date,
  from,
  to,
  onDateChange,
}: BlockDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = date ? parseISO(date) : undefined;
  const minDate = from ? parseISO(from) : undefined;
  const maxDate = to ? parseISO(to) : undefined;
  const displayDate = selected
    ? format(selected, "EEE, MMM d, yyyy")
    : "Pick a date";
  const disabledDates =
    minDate && maxDate
      ? [{ before: minDate }, { after: maxDate }]
      : minDate
        ? [{ before: minDate }]
        : maxDate
          ? [{ after: maxDate }]
          : undefined;

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    onDateChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Itinerary date"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="rounded-sm bg-transparent px-0 py-1 text-xl font-bold leading-tight text-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        {displayDate}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={disabledDates}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
