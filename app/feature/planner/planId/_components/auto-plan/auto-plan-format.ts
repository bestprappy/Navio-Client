import { formatClockMinute, formatTimeLabel } from "../itinerary/day-timing";
import type { AutoPlanMode, UnplannedStop } from "./day-auto-plan";
import type { OpeningWindow } from "./opening-hours";

/** "9:20 AM". */
export function formatPlanMinute(minute: number): string {
  return formatTimeLabel(formatClockMinute(Math.min(minute, 24 * 60 - 1)));
}

/** "45 min", "1 hr", "1 hr 10 min". */
export function formatPlanDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

const MODE_LABEL: Record<AutoPlanMode, (duration: string) => string> = {
  drive: (duration) => `${duration} drive`,
  walk: (duration) => `${duration} walk`,
  transit: (duration) => `${duration} by public transport`,
};

export function formatPlanTravel(minutes: number, distanceKm: number, mode: AutoPlanMode): string {
  const distance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
  // Short hops are walked whatever the day's mode, as the estimate assumes.
  const effective = distanceKm < 0.5 ? "walk" : mode;
  return `${MODE_LABEL[effective](formatPlanDuration(minutes))}, ${distance}`;
}

export function formatOpeningWindows(hours: readonly OpeningWindow[] | null): string {
  if (hours === null) return "Opening hours unknown";
  if (!hours.length) return "Closed";
  if (hours.length === 1 && hours[0][0] === 0 && hours[0][1] >= 1440) return "Open 24 hours";
  return `Open ${hours.map(([open, close]) => `${formatPlanMinute(open)} – ${formatPlanMinute(close)}`).join(", ")}`;
}

export function describeUnplanned(stop: UnplannedStop, weekday: string | null, endMinute: number): string {
  switch (stop.reason) {
    case "closed":
      return weekday ? `Closed on ${weekday}` : "Closed that day";
    case "hours":
      return `${formatOpeningWindows(stop.hours)}, outside your day`;
    case "time":
      return `No time left before ${formatPlanMinute(endMinute)}`;
  }
}

export const AUTO_PLAN_MODE_OPTIONS: ReadonlyArray<{ value: AutoPlanMode; label: string }> = [
  { value: "drive", label: "Driving" },
  { value: "transit", label: "Public transport" },
  { value: "walk", label: "Walking" },
];
