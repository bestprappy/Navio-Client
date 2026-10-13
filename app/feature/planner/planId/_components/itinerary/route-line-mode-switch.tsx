"use client";

import { type KeyboardEvent, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Route } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  routeLineModeAtom,
  setRouteLineModeAtom,
  type RouteLineMode,
} from "../overview/trip-builder.atoms";

const ROUTE_LINE_MODE_OPTIONS: readonly { mode: RouteLineMode; label: string; description: string }[] = [
  { mode: "all", label: "All", description: "Draw every day's route on the map" },
  { mode: "day", label: "Day", description: "Draw the route of the day you scroll to" },
  { mode: "stop", label: "Place", description: "Focus the leg to the place you scroll to and fade the rest of its day" },
];

/** Chooses which routes the planner map draws. A radio group: arrow keys move and select. */
export function RouteLineModeSwitch() {
  const mode = useAtomValue(routeLineModeAtom);
  const setMode = useSetAtom(setRouteLineModeAtom);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    <div className="flex items-center gap-2">
      <span id="route-line-mode-label" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Route className="size-4" aria-hidden="true" />
        Routes
      </span>
      <div
        role="radiogroup"
        aria-labelledby="route-line-mode-label"
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
              title={option.description}
              className={cn(
                "min-h-8 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
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
    </div>
  );
}
