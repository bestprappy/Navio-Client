import { memo } from "react";
import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import type { StopKind } from "./explore-plans-api";

/** Past this many stops a day collapses to "+n", so a busy day cannot push the card wider. */
const MAX_STOPS_PER_DAY = 7;
const MAX_DAYS = 6;

type RouteStripProps = {
  days: { stops: StopKind[] }[];
  placeCount: number;
  chargerCount: number;
  /** The colour behind the strip, so the gap ring around each stop cuts the road cleanly. */
  surface?: "card" | "muted";
  className?: string;
};

const SURFACE_CLASSES = {
  card: { ring: "ring-card", fill: "bg-card" },
  muted: { ring: "ring-muted", fill: "bg-muted" },
} as const;

function describe(dayCount: number, placeCount: number, chargerCount: number): string {
  const parts = [
    `${dayCount} ${dayCount === 1 ? "day" : "days"}`,
    `${placeCount} ${placeCount === 1 ? "place" : "places"}`,
  ];
  if (chargerCount > 0) {
    parts.push(`${chargerCount} charging ${chargerCount === 1 ? "stop" : "stops"}`);
  }
  return `Route: ${parts.join(", ")}`;
}

/**
 * The trip's shape at a glance: one dot per place, a bolt per charging stop,
 * and a break between days.
 *
 * <p>Drawn from the real itinerary rather than decoration, so two plans with the
 * same destination still look different. Read as a single image by assistive
 * technology, with the counts spelled out in its label.
 */
export const RouteStrip = memo(function RouteStrip({
  days,
  placeCount,
  chargerCount,
  surface = "card",
  className,
}: RouteStripProps) {
  const { ring, fill } = SURFACE_CLASSES[surface];
  const visibleDays = days.slice(0, MAX_DAYS);
  const hiddenDays = days.length - visibleDays.length;

  if (days.length === 0) return null;

  return (
    <div
      role="img"
      aria-label={describe(days.length, placeCount, chargerCount)}
      className={cn("flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1", className)}
    >
      {visibleDays.map((day, dayIndex) => {
        const shown = day.stops.slice(0, MAX_STOPS_PER_DAY);
        const overflow = day.stops.length - shown.length;
        return (
          <span key={dayIndex} className="relative flex min-w-0 items-center gap-2.5 py-1">
            {/* The day's road: visible between its stops, broken between days. */}
            <span aria-hidden="true" className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary/25" />
            {shown.length === 0 ? (
              <span aria-hidden="true" className={cn("relative size-2 rounded-full border border-border", fill)} />
            ) : (
              shown.map((kind, stopIndex) =>
                kind === "charger" ? (
                  <span
                    key={stopIndex}
                    aria-hidden="true"
                    className={cn(
                      "relative flex size-4 items-center justify-center rounded-full bg-charging ring-2",
                      ring,
                    )}
                  >
                    <Zap className="size-2.5 fill-current text-background" />
                  </span>
                ) : (
                  <span
                    key={stopIndex}
                    aria-hidden="true"
                    className={cn("relative size-2 rounded-full bg-primary ring-2", ring)}
                  />
                ),
              )
            )}
            {overflow > 0 && (
              <span aria-hidden="true" className={cn("relative pl-0.5 text-xs text-muted-foreground", fill)}>
                +{overflow}
              </span>
            )}
          </span>
        );
      })}
      {hiddenDays > 0 && (
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          +{hiddenDays} {hiddenDays === 1 ? "day" : "days"}
        </span>
      )}
    </div>
  );
});
