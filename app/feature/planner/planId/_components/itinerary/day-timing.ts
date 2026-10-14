import { isEvChargerPlaceItem, type PlaceItem } from "../constants/types";
import { typicalVisitMinutesForType } from "./visit-length";

export { DEFAULT_VISIT_MINUTES } from "./visit-length";

/** Where a day without a fixed first stop begins. */
export const DEFAULT_DAY_START_MINUTE = 9 * 60;
const LAST_MINUTE = 24 * 60 - 1;

export type DayTimingMode = "keep-fixed" | "replace-all";

export type DayTimingInput = {
  /** The day's stops in order, chargers included; notes and checklists are left out. */
  stops: readonly PlaceItem[];
  /** Routed travel minutes into each stop. Missing or `null` means not known. */
  travelMinutesByItemId: ReadonlyMap<string, number | null>;
  /** The first stop is reached from the day's start anchor rather than starting the day. */
  startsFromAnchor: boolean;
};

export type TimeUpdate = { time: string; timeEnd: string };

export type DayTimingIssue =
  | { kind: "late"; itemId: string; name: string; minutes: number }
  | { kind: "missing-travel"; itemId: string; name: string }
  | { kind: "missing-duration"; itemId: string; name: string }
  | { kind: "past-midnight"; itemId: string; name: string };

export type ReplacedTime = {
  itemId: string;
  name: string;
  from: { time: string; timeEnd?: string };
  to: TimeUpdate;
};

export type DaySchedule = {
  /** New times for stops Calculate times may change; only stops it could work out. */
  updates: ReadonlyMap<string, TimeUpdate>;
  issues: readonly DayTimingIssue[];
  /** Fixed times this run replaces; always empty when keeping fixed times. */
  replaced: readonly ReplacedTime[];
};

export function parseClockMinute(value: string | undefined): number | null {
  const match = value ? /^(\d{1,2}):(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

export function formatClockMinute(minute: number): string {
  const rounded = Math.round(minute);
  return `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(2, "0")}`;
}

/** "9:05 AM", matching the time chips on place cards. */
export function formatTimeLabel(time: string, timeEnd?: string): string {
  const one = (value: string) => {
    const [hour, minute = "00"] = value.split(":");
    const h = Number(hour);
    return `${h % 12 === 0 ? 12 : h % 12}:${minute} ${h >= 12 ? "PM" : "AM"}`;
  };
  return timeEnd ? `${one(time)} – ${one(timeEnd)}` : one(time);
}

/** A time the traveller typed. Older times have no source and were typed too. */
export function isFixedTime(item: PlaceItem): boolean {
  return !isEvChargerPlaceItem(item) && parseClockMinute(item.time) !== null && item.timeSource !== "calculated";
}

function visitMinutes(item: PlaceItem): number | null {
  if (isEvChargerPlaceItem(item)) {
    const charge = item.evCharger?.chargingDurationMinutes ?? item.evCharger?.estimatedChargeMinutes;
    return charge != null && Number.isFinite(charge) && charge >= 0 ? charge : null;
  }
  const start = parseClockMinute(item.time);
  const end = parseClockMinute(item.timeEnd);
  // No end to learn from: a typical visit to this kind of place, as Auto plan assumes.
  return start !== null && end !== null && end > start ? end - start : typicalVisitMinutesForType(item.placeType);
}

function travelInto(input: DayTimingInput, index: number): number | null {
  if (index === 0 && !input.startsFromAnchor) return 0;
  const minutes = input.travelMinutesByItemId.get(input.stops[index].id);
  return minutes != null && Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

/**
 * Leaves early enough to reach the first fixed stop on time, but never later than the default
 * start: a 7:30 AM tour pulls the morning earlier, a 3 PM one does not push it into the afternoon.
 */
function dayStartMinute(input: DayTimingInput, isFixed: (item: PlaceItem) => boolean): number {
  const firstFixed = input.stops.findIndex(isFixed);
  if (firstFixed < 0) return DEFAULT_DAY_START_MINUTE;
  let needed = 0;
  for (let index = 0; index <= firstFixed; index++) {
    const travel = travelInto(input, index);
    const visit = index < firstFixed ? visitMinutes(input.stops[index]) : 0;
    if (travel === null || visit === null) return DEFAULT_DAY_START_MINUTE;
    needed += travel + visit;
  }
  const latestStart = parseClockMinute(input.stops[firstFixed].time)! - needed;
  return Math.max(0, Math.min(DEFAULT_DAY_START_MINUTE, latestStart));
}

/**
 * Works out each stop's time from visit lengths and routed travel, in the day's order.
 *
 * Fixed times are anchors: they never move, and a stop that cannot fit before one is reported
 * as a shortfall instead of being squeezed. Missing travel or charging data stops the
 * calculation until the next fixed time rather than being counted as zero.
 */
export function calculateDaySchedule(input: DayTimingInput, mode: DayTimingMode = "keep-fixed"): DaySchedule {
  const isFixed = mode === "keep-fixed" ? isFixedTime : () => false;
  const firstStop = input.stops[0];
  // Replacing every time keeps the day's own start, the one time the traveller expects to stay.
  const firstStart = mode === "replace-all" && firstStop && !isEvChargerPlaceItem(firstStop)
    ? parseClockMinute(firstStop.time)
    : null;
  const updates = new Map<string, TimeUpdate>();
  const issues: DayTimingIssue[] = [];
  let cursor: number | null = firstStart ?? dayStartMinute(input, isFixed);

  input.stops.forEach((stop, index) => {
    const travel = index === 0 && firstStart !== null ? 0 : travelInto(input, index);
    const arrival = cursor === null || travel === null ? null : cursor + travel;

    if (isFixed(stop)) {
      const start = parseClockMinute(stop.time)!;
      if (arrival !== null && arrival > start) {
        issues.push({ kind: "late", itemId: stop.id, name: stop.name, minutes: Math.ceil(arrival - start) });
      }
      const end = parseClockMinute(stop.timeEnd);
      cursor = end !== null && end > start ? end : start + typicalVisitMinutesForType(stop.placeType);
      return;
    }

    if (cursor === null) return;
    if (travel === null) {
      issues.push({ kind: "missing-travel", itemId: stop.id, name: stop.name });
      cursor = null;
      return;
    }
    const visit = visitMinutes(stop);
    if (visit === null) {
      issues.push({ kind: "missing-duration", itemId: stop.id, name: stop.name });
      cursor = null;
      return;
    }
    const start = Math.round(arrival!);
    const end = Math.round(arrival! + visit);
    if (end > LAST_MINUTE) {
      issues.push({ kind: "past-midnight", itemId: stop.id, name: stop.name });
      cursor = null;
      return;
    }
    // Chargers take part in the chain but have no time on their card.
    if (!isEvChargerPlaceItem(stop)) updates.set(stop.id, { time: formatClockMinute(start), timeEnd: formatClockMinute(end) });
    cursor = arrival! + visit;
  });

  const replaced = mode === "replace-all"
    ? input.stops.flatMap((stop): ReplacedTime[] => {
        const next = updates.get(stop.id);
        if (!next || !isFixedTime(stop) || (next.time === stop.time && next.timeEnd === stop.timeEnd)) return [];
        return [{ itemId: stop.id, name: stop.name, from: { time: stop.time!, timeEnd: stop.timeEnd }, to: next }];
      })
    : [];

  return { updates, issues, replaced };
}

/**
 * Whether the day's calculated times no longer match its places, routes or visit lengths.
 * Days that were never calculated are never stale: untimed stops are simply untimed.
 */
export function isDayScheduleStale(stops: readonly PlaceItem[], schedule: DaySchedule): boolean {
  if (!stops.some((stop) => stop.timeSource === "calculated")) return false;
  return stops.some((stop) => {
    const next = schedule.updates.get(stop.id);
    return next !== undefined && (next.time !== stop.time || next.timeEnd !== stop.timeEnd);
  });
}

/** "25 more minutes", "1 hr 5 min more". */
export function formatShortfall(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} more ${rest === 1 ? "minute" : "minutes"}`;
  return rest ? `${hours} hr ${rest} min more` : `${hours} more ${hours === 1 ? "hour" : "hours"}`;
}

export function describeTimingIssue(issue: DayTimingIssue): string {
  switch (issue.kind) {
    case "late":
      return `You need ${formatShortfall(issue.minutes)} to reach ${issue.name} on time.`;
    case "missing-travel":
      return `Travel time to ${issue.name} isn't available yet, so its time wasn't calculated.`;
    case "missing-duration":
      return `${issue.name} has no charging time yet, so later times weren't calculated.`;
    case "past-midnight":
      return `${issue.name} would end after midnight, so its time wasn't calculated.`;
  }
}
