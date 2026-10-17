"use client";

import { type KeyboardEvent, useId, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn } from "@/lib/utils";

import {
  routeLineModeAtom,
  setRouteLineModeAtom,
  type RouteLineMode,
} from "../overview/trip-builder.atoms";

const ROUTE_LINE_MODE_OPTIONS: readonly { mode: RouteLineMode; label: string; description: string }[] = [
  { mode: "all", label: "All", description: "Every day's route is drawn on the map." },
  { mode: "day", label: "Day", description: "Only the day you scroll to is drawn." },
  { mode: "stop", label: "Place", description: "The leg to the place you scroll to stands out; the rest of its day fades." },
];

/**
 * Chooses which routes the planner map draws, inside the itinerary options menu.
 * A radio group: arrow keys move and select.
 */
export function RouteLineModeSwitch() {
  const mode = useAtomValue(routeLineModeAtom);
  const setMode = useSetAtom(setRouteLineModeAtom);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelId = useId();
  const descriptionId = useId();
  const selected = ROUTE_LINE_MODE_OPTIONS.find((option) => option.mode === mode) ?? ROUTE_LINE_MODE_OPTIONS[0];

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = ROUTE_LINE_MODE_OPTIONS.findIndex((option) => option.mode === mode);
    const last = ROUTE_LINE_MODE_OPTIONS.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? (current === last ? 0 : current + 1)
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (current === 0 ? last : current - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;

    event.preventDefault();
    setMode(ROUTE_LINE_MODE_OPTIONS[next].mode);
    optionRefs.current[next]?.focus();
  }

  return (
    <div className="space-y-2">
      <span id={labelId} className="block text-xs font-semibold text-muted-foreground">
        Route lines on map
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className="flex items-center gap-1 rounded-lg bg-muted p-1"
        onKeyDown={handleKeyDown}
      >
        {ROUTE_LINE_MODE_OPTIONS.map((option, index) => {
          const checked = option.mode === mode;
          return (
            <button
              key={option.mode}
              ref={(element) => {
                optionRefs.current[index] = element;
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
              onClick={() => setMode(option.mode)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span id={descriptionId} className="block text-xs leading-snug text-muted-foreground">
        {selected.description}
      </span>
    </div>
  );
}
