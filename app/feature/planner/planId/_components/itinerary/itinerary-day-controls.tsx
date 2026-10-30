"use client";

import { type KeyboardEvent, useEffect, useId, useRef } from "react";
import { format, isValid, parseISO } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import {
  itineraryDayViewAtom,
  selectedItineraryDayAtom,
  selectItineraryDayAtom,
  type ItineraryDayView,
} from "./itinerary-day-view.atoms";

const DAY_VIEWS: readonly { value: ItineraryDayView; label: string; description: string }[] = [
  { value: "all", label: "All days", description: "Every day is listed in order." },
  { value: "single", label: "One day", description: "Only the day you pick is shown." },
];

// Shared snapshots can intentionally omit calendar dates; preserve their day numbers.
function dayDateLabel(date: string): string {
  const parsed = date ? parseISO(date) : null;
  return parsed && isValid(parsed) ? format(parsed, "EEE, MMM d") : "Date not set";
}

/** Roving radio-group keys: arrows move and select, Home/End jump. */
function nextRadioIndex(key: string, current: number, last: number): number | null {
  if (key === "ArrowRight" || key === "ArrowDown") return current === last ? 0 : current + 1;
  if (key === "ArrowLeft" || key === "ArrowUp") return current <= 0 ? last : current - 1;
  if (key === "Home") return 0;
  if (key === "End") return last;
  return null;
}

type ItineraryDayControlsProps = {
  /** Called after a day is picked, so the containing menu can close. */
  onDaySelected?: () => void;
};

/**
 * Chooses whether the itinerary lists every day or one picked day,
 * inside the itinerary options menu.
 */
export function ItineraryDayControls({ onDaySelected }: ItineraryDayControlsProps) {
  const [view, setView] = useAtom(itineraryDayViewAtom);
  const days = useAtomValue(itineraryBlocksAtom);
  const selectedDay = useAtomValue(selectedItineraryDayAtom);
  const selectDay = useSetAtom(selectItineraryDayAtom);
  const viewRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelId = useId();
  const descriptionId = useId();
  const dayListLabelId = useId();
  const selectedView = DAY_VIEWS.find((option) => option.value === view) ?? DAY_VIEWS[0];
  const selectedIndex = days.findIndex((day) => day.id === selectedDay?.id);

  // Long trips scroll the list; keep the picked day in sight when it appears.
  useEffect(() => {
    if (view === "single") dayRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [view, selectedIndex]);

  function handleViewKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = DAY_VIEWS.findIndex((option) => option.value === view);
    const next = nextRadioIndex(event.key, current, DAY_VIEWS.length - 1);
    if (next === null) return;
    event.preventDefault();
    setView(DAY_VIEWS[next].value);
    viewRefs.current[next]?.focus();
  }

  function handleDayKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextRadioIndex(event.key, selectedIndex, days.length - 1);
    if (next === null) return;
    event.preventDefault();
    selectDay(days[next].id);
    dayRefs.current[next]?.focus();
  }

  return (
    <div className="space-y-2">
      <span id={labelId} className="block text-xs font-semibold text-muted-foreground">
        Days shown
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className="flex items-center gap-1 rounded-lg bg-muted p-1"
        onKeyDown={handleViewKeyDown}
      >
        {DAY_VIEWS.map((option, index) => {
          const checked = option.value === view;
          return (
            <button
              key={option.value}
              ref={(element) => {
                viewRefs.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className={cn(
                "min-h-8 flex-1 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                checked
                  ? "bg-card font-medium text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span id={descriptionId} className="block text-xs leading-snug text-muted-foreground">
        {selectedView.description}
      </span>

      {view === "single" && days.length > 0 && (
        <div
          role="radiogroup"
          aria-labelledby={dayListLabelId}
          className="max-h-60 space-y-0.5 overflow-y-auto overscroll-contain rounded-lg border border-border/60 p-1"
          onKeyDown={handleDayKeyDown}
        >
          <span id={dayListLabelId} className="sr-only">Day to show</span>
          {days.map((day, index) => {
            const checked = index === selectedIndex;
            return (
              <button
                key={day.id}
                ref={(element) => {
                  dayRefs.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked || (selectedIndex < 0 && index === 0) ? 0 : -1}
                className={cn(
                  "flex min-h-10 w-full items-center gap-3 rounded-md px-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
                  checked ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                onClick={() => {
                  selectDay(day.id);
                  onDaySelected?.();
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                    checked ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className={cn("text-foreground", checked && "font-medium")}>Day {index + 1}</span>
                  <span className="truncate text-xs text-muted-foreground">{dayDateLabel(day.date)}</span>
                </span>
                {checked && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
