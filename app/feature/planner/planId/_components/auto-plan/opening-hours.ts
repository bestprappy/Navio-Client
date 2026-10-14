import type { PlaceSearchResult } from "../constants/types";

/** Minutes from midnight; `end` may pass 1440 only while parsing overnight rows. */
export type OpeningWindow = readonly [start: number, end: number];
type HoursSource = Pick<PlaceSearchResult, "openingHours" | "weekdayOpeningHours">;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minute(hour: string, minutes: string | undefined, meridiem: string | undefined): number | null {
  const h = Number(hour);
  const m = Number(minutes ?? 0);
  if (m > 59 || h > (meridiem ? 12 : 24) || (meridiem && h < 1) || (h === 24 && m !== 0)) return null;
  return meridiem ? (h % 12 + (meridiem.toUpperCase() === "PM" ? 12 : 0)) * 60 + m : h * 60 + m;
}

/** Preserve overnight windows: Tuesday 18:00–02:00 belongs to Tuesday and Wednesday. */
function parseWindows(value: string): OpeningWindow[] | null {
  const text = value.replace(/[  ]/g, " ").trim();
  if (/^Closed$/i.test(text)) return [];
  if (/^(?:Open\s+)?24\s*(?:hours?|hrs?)$|^24\/7$/i.test(text)) return [[0, 1440]];
  const windows: OpeningWindow[] = [];
  for (const part of text.split(",")) {
    const match = part.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[–—-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return null;
    const [, sh, sm, sMer, eh, em, eMer] = match;
    // "9–5 PM" is ambiguous; do not turn a guess into verified hours.
    if (Boolean(sMer) !== Boolean(eMer)) return null;
    const start = minute(sh, sm, sMer);
    let end = minute(eh, em, eMer);
    if (start === null || end === null || start >= 1440 || end === start) return null;
    if (end < start) end += 1440;
    windows.push([start, end]);
  }
  return windows;
}

function weeklyHours(place: HoursSource): Map<number, OpeningWindow[] | null> {
  const rows = place.weekdayOpeningHours?.length ? place.weekdayOpeningHours : place.openingHours?.split(/\s*[|;\n]\s*/) ?? [];
  const result = new Map<number, OpeningWindow[] | null>();
  for (const row of rows) {
    const match = row.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday):\s*(.+)$/i);
    if (!match) continue;
    const day = DAYS.findIndex(value => value.toLowerCase() === match[1].toLowerCase());
    result.set(day, parseWindows(match[2]));
  }
  // A dayless summary is safe only when it explicitly says it applies every day.
  if (!result.size && place.openingHours) {
    const text = place.openingHours.trim();
    if (/^(?:Open\s+)?24\s*(?:hours?|hrs?)$|^24\/7$/i.test(text) || /\s+(?:every day|daily)$/i.test(text)) {
      const windows = parseWindows(text.replace(/\s+(?:every day|daily)$/i, ""));
      for (let day = 0; day < 7; day++) result.set(day, windows);
    }
  }
  return result;
}

/** Weekday of a local calendar date, independent of the browser's timezone. */
export function weekdayOf(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  return DAYS[parsed.getUTCDay()];
}

/** Opening windows on a travel date: `[]` is closed, `null` is unknown. */
export function getOpeningWindows(place: HoursSource, date: string): OpeningWindow[] | null {
  const weekday = weekdayOf(date);
  if (!weekday) return null;
  const day = DAYS.indexOf(weekday);
  const week = weeklyHours(place);
  const today = week.get(day);
  if (today === undefined || today === null) return null;
  const previous = week.get((day + 6) % 7);
  // A missing previous day can hide an overnight opening. Remain conservative.
  if (previous === undefined || previous === null) return today.length ? today.map(([a, b]) => [a, Math.min(b, 1440)]) : null;
  const windows: OpeningWindow[] = [
    ...today.map(([a, b]): OpeningWindow => [a, Math.min(b, 1440)]),
    ...previous.filter(([, end]) => end > 1440).map(([, end]): OpeningWindow => [0, end - 1440]),
  ].sort((a, b) => a[0] - b[0]);
  return windows.reduce<OpeningWindow[]>((merged, window) => {
    const last = merged.at(-1);
    if (last && window[0] <= last[1]) merged[merged.length - 1] = [last[0], Math.max(last[1], window[1])];
    else merged.push(window);
    return merged;
  }, []);
}

/** The earliest start that keeps the whole visit inside one opening window and before `latestEnd`. */
export function fitVisit(windows: readonly OpeningWindow[] | null, earliest: number, duration: number, latestEnd: number): number | null {
  if (windows === null) return earliest + duration <= latestEnd ? earliest : null;
  for (const [open, close] of windows) {
    const start = Math.max(open, earliest);
    if (start + duration <= Math.min(close, latestEnd)) return start;
  }
  return null;
}
