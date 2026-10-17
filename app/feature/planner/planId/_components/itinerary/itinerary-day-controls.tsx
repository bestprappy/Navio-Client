"use client";

import { format, parseISO } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import {
  itineraryDayViewAtom,
  selectedItineraryDayAtom,
  selectItineraryDayAtom,
  type ItineraryDayView,
} from "./itinerary-day-view.atoms";

const DAY_VIEWS: { value: ItineraryDayView; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "single", label: "By date" },
];

export function ItineraryDayControls() {
  const [view, setView] = useAtom(itineraryDayViewAtom);
  const days = useAtomValue(itineraryBlocksAtom);
  const selectedDay = useAtomValue(selectedItineraryDayAtom);
  const selectDay = useSetAtom(selectItineraryDayAtom);
  const dayOptions = days.map((day, index) => ({
    value: day.id,
    label: `Day ${index + 1} · ${format(parseISO(day.date), "EEE, MMM d, yyyy")}`,
  }));
  const selectedIndex = days.findIndex((day) => day.id === selectedDay?.id);

  return (
    <div className="grid min-w-0 gap-3 @lg/planner:grid-cols-[auto_minmax(0,1fr)] @lg/planner:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-muted-foreground">Show:</span>
        <div role="group" aria-label="Days displayed" className="inline-flex shrink-0 rounded-lg border border-border bg-muted/40 p-0.5">
        {DAY_VIEWS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => setView(value)}
            className={cn(
              "min-h-9 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              view === value ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >{label}</button>
        ))}
        </div>
      </div>
      {view === "single" && selectedDay && (
        <Select
          items={dayOptions}
          value={selectedDay.id}
          onValueChange={(value) => { if (value) selectDay(value); }}
        >
          <SelectTrigger aria-label="Choose itinerary day" className="min-w-0 w-full gap-2 bg-card px-3 data-[size=default]:h-11">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue className="min-w-0">
              {() => <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 font-medium">Day {selectedIndex + 1}</span>
                <span className="truncate text-muted-foreground">{format(parseISO(selectedDay.date), "EEE, MMM d, yyyy")}</span>
              </span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false} className="max-h-[min(18rem,var(--available-height))] min-w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-1">
            {dayOptions.map((day) => (
              <SelectItem key={day.value} value={day.value} className="min-h-11 px-3 pr-8 [&>span:first-child]:min-w-0 [&>span:first-child]:shrink [&>span:first-child]:whitespace-normal">{day.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
