import type { PlaceItem, PlaceScheduleEntry } from "../constants/types";

/** Matches the trip service's limits, so a schedule that saves locally also saves remotely. */
export const MAX_SCHEDULE_ENTRIES = 40;
export const MAX_SCHEDULE_LABEL_LENGTH = 200;

/** A gap between two moments worth pointing out as free time. */
export const FREE_TIME_MINUTES = 20;

const DAY_MINUTES = 24 * 60;
const DEFAULT_STEP_MINUTES = 10;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_TOKEN = String.raw`\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?`;
const LEADING_TIME = new RegExp(String.raw`^(${TIME_TOKEN})(?:\s*[-–—]\s*(${TIME_TOKEN}))?\s+(.+)$`, "i");

function toMinute(time: string | undefined | null): number | null {
  if (!time || !TIME_PATTERN.test(time)) return null;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function fromMinute(minute: number): string {
  const wrapped = ((Math.round(minute) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

export function isScheduleTime(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

/**
 * Reads what a traveller types into a time field: "9", "9:30", "930", "9.30", "9:30 pm", "21:30".
 * Returns HH:mm, or null when it is not a time.
 */
export function parseClockInput(value: string): string | null {
  const match = /^(\d{1,2})(?:[:.]?(\d{2}))?\s*(am|pm)?$/i.exec(value.trim());
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const period = match[3]?.toLowerCase();
  if (minute > 59) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (period === "pm" ? 12 : 0);
  } else if (hour > 23) {
    return null;
  }
  return fromMinute(hour * 60 + minute);
}

/** "9:05 AM", matching the time chips on place cards. */
export function formatClock(time: string): string {
  const minute = toMinute(time);
  if (minute === null) return time;
  const hour = Math.floor(minute / 60);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

export function createScheduleEntry(time: string, label = "", timeEnd?: string): PlaceScheduleEntry {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `moment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return timeEnd ? { id, time, timeEnd, label } : { id, time, label };
}

/** Earliest first; moments at the same time keep the order they were written in. */
export function sortSchedule(entries: readonly PlaceScheduleEntry[]): PlaceScheduleEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (toMinute(a.entry.time) ?? 0) - (toMinute(b.entry.time) ?? 0) || a.index - b.index)
    .map(({ entry }) => entry);
}

/** Moves every moment by the same amount the stop's start moved, so "10 minutes after arriving" stays true. */
export function shiftSchedule(
  entries: readonly PlaceScheduleEntry[],
  fromTime: string | undefined,
  toTime: string | undefined,
): readonly PlaceScheduleEntry[] {
  const from = toMinute(fromTime);
  const to = toMinute(toTime);
  if (from === null || to === null || from === to) return entries;
  const delta = to - from;
  return entries.map((entry) => {
    const start = toMinute(entry.time);
    const end = toMinute(entry.timeEnd);
    return {
      ...entry,
      time: start === null ? entry.time : fromMinute(start + delta),
      ...(entry.timeEnd ? { timeEnd: end === null ? entry.timeEnd : fromMinute(end + delta) } : {}),
    };
  });
}

type StopTimes = Partial<Pick<PlaceItem, "time" | "timeEnd" | "timeSource">>;

/** Applies new stop times, carrying the stop's own schedule along with its start. */
export function withStopTimes(item: PlaceItem, times: StopTimes): PlaceItem {
  const next = { ...item, ...times };
  if (!item.schedule?.length || !("time" in times)) return next;
  return { ...next, schedule: [...shiftSchedule(item.schedule, item.time, times.time)] };
}

/** When the moment after this one most likely starts: as it ends, or a little after it starts. */
export function timeAfter(entry: PlaceScheduleEntry): string {
  const end = toMinute(entry.timeEnd);
  if (end !== null) return fromMinute(end);
  const start = toMinute(entry.time);
  return start === null ? entry.time : fromMinute(start + DEFAULT_STEP_MINUTES);
}

/** Where a new moment most likely starts: after the last one, or when the stop starts. */
export function suggestNextTime(item: Pick<PlaceItem, "time" | "schedule">): string {
  const last = item.schedule?.length ? sortSchedule(item.schedule).at(-1) : undefined;
  if (last) return timeAfter(last);
  return isScheduleTime(item.time) ? item.time : "09:00";
}

function isWithin(minute: number, start: number, end: number | null): boolean {
  if (end === null) return minute >= start;
  // A stop that runs past midnight, such as 23:00-01:00, wraps around.
  return start <= end ? minute >= start && minute <= end : minute >= start || minute <= end;
}

/** Whether a moment falls outside the stop's own time. Without a stop time, nothing can be outside. */
export function isOutsideStop(entry: PlaceScheduleEntry, item: Pick<PlaceItem, "time" | "timeEnd">): boolean {
  const start = toMinute(item.time);
  if (start === null) return false;
  const end = toMinute(item.timeEnd);
  const entryStart = toMinute(entry.time);
  const entryEnd = toMinute(entry.timeEnd);
  return (entryStart !== null && !isWithin(entryStart, start, end))
    || (entryEnd !== null && !isWithin(entryEnd, start, end));
}

/** Free minutes between a moment and the one before it, when the gap is long enough to mention. */
export function freeMinutesBefore(entries: readonly PlaceScheduleEntry[], index: number): number | null {
  if (index <= 0 || index >= entries.length) return null;
  const previous = entries[index - 1];
  const previousEnd = toMinute(previous.timeEnd) ?? toMinute(previous.time);
  const start = toMinute(entries[index].time);
  if (previousEnd === null || start === null) return null;
  const gap = start - previousEnd;
  return gap >= FREE_TIME_MINUTES ? gap : null;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/**
 * Splits a line that starts with a time, such as "7:30 AM Grab the bags" or "9:00-9:10 Check in",
 * into its times and label. A bare number ("10 people") is not taken as a time.
 */
export function splitLeadingTime(text: string): { time: string; timeEnd?: string; label: string } | null {
  const match = LEADING_TIME.exec(text.trim());
  if (!match) return null;
  const [, startText, endText, label] = match;
  if (!/[:.]|am|pm/i.test(startText)) return null;
  const time = parseClockInput(startText);
  if (!time) return null;
  const timeEnd = endText ? parseClockInput(endText) : null;
  if (endText && !timeEnd) return null;
  return timeEnd ? { time, timeEnd, label: label.trim() } : { time, label: label.trim() };
}

export function isScheduleEntry(value: unknown): value is PlaceScheduleEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && entry.id.length > 0
    && isScheduleTime(entry.time)
    && (entry.timeEnd == null || isScheduleTime(entry.timeEnd))
    && typeof entry.label === "string";
}
