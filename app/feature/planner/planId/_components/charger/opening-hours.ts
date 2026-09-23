const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_PATTERN = "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday";

function cleanHours(value: string): string {
  const normalized = value.replace(/[\u202f\u00a0]/g, " ").replace(/\s+/g, " ").trim();
  if (/^(?:open\s+)?24\s*(?:hours?|hrs?)$|^24\/7$/i.test(normalized)) return "Open 24 hours";
  if (/^closed$/i.test(normalized)) return "Closed";
  return normalized.replace(/\s*[–—]\s*/g, " – ");
}

/** Open span in minutes from midnight, end exclusive. */
export type OpenSegment = readonly [start: number, end: number];

export type ScheduleRow = {
  label: string;
  hours: string;
  startDay: number;
  endDay: number;
  /** Null when the hours text is not a recognisable time range. */
  segments: OpenSegment[] | null;
};

export type OpeningHoursSchedule =
  | { kind: "text"; text: string }
  | { kind: "schedule"; rows: ScheduleRow[] };

const DAY_MINUTES = 24 * 60;
const TIME_RANGE =
  /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i;

function toMinutes(hour: string, minute: string | undefined, meridiem: string | undefined): number | null {
  const h = Number(hour);
  const m = minute ? Number(minute) : 0;
  if (m > 59) return null;
  if (!meridiem) return h > 24 ? null : h * 60 + m;
  if (h < 1 || h > 12) return null;
  return ((h % 12) + (meridiem.toUpperCase() === "PM" ? 12 : 0)) * 60 + m;
}

export function parseOpenSegments(hours: string): OpenSegment[] | null {
  if (hours === "Open 24 hours") return [[0, DAY_MINUTES]];
  if (hours === "Closed") return [];

  const segments: OpenSegment[] = [];
  for (const part of hours.split(",")) {
    const match = part.trim().match(TIME_RANGE);
    if (!match) return null;
    const [, sh, sm, sMer, eh, em, eMer] = match;
    const start = toMinutes(sh!, sm, sMer ?? eMer);
    let end = toMinutes(eh!, em, eMer);
    if (start === null || end === null) return null;
    if (end === 0) end = DAY_MINUTES;
    if (end > start) {
      segments.push([start, end]);
    } else {
      segments.push([start, DAY_MINUTES]);
      if (end > 0) segments.push([0, end]);
    }
  }
  return segments;
}

function parseDaily(normalized: string) {
  const pattern = new RegExp(`(${DAY_PATTERN}):\\s*([\\s\\S]*?)(?=(?:\\s*[|;\\n]\\s*|\\s+)(?:${DAY_PATTERN}):|$)`, "gi");
  const daily = [...normalized.matchAll(pattern)].map((match) => ({
    day: WEEKDAYS.findIndex((day) => day.toLowerCase() === match[1]!.toLowerCase()),
    hours: cleanHours(match[2]!.replace(/[|;\s]+$/, "")),
  }));
  return daily.length > 0 && daily.every((row) => row.hours) ? daily : null;
}

function toRow(label: string, hours: string, startDay: number, endDay: number): ScheduleRow {
  return { label, hours, startDay, endDay, segments: parseOpenSegments(hours) };
}

/** Structured schedule for the hours widget; falls back to provider text when unparseable. */
export function getOpeningHoursSchedule(value?: string | null): OpeningHoursSchedule {
  if (!value?.trim()) return { kind: "text", text: "Hours unavailable" };
  const normalized = value.replace(/[  ]/g, " ").trim();
  const daily = parseDaily(normalized);

  if (!daily) {
    const hours = cleanHours(normalized.replace(/\s+(?:every\s*day|daily)$/i, ""));
    const segments = parseOpenSegments(hours);
    return segments ? { kind: "schedule", rows: [toRow("Every day", hours, 0, 6)] } : { kind: "text", text: hours };
  }

  const isFullWeek = new Set(daily.map((row) => row.day)).size === 7;
  if (isFullWeek && daily.every((row) => row.hours === daily[0]!.hours)) {
    return { kind: "schedule", rows: [toRow("Every day", daily[0]!.hours, 0, 6)] };
  }

  const rows: ScheduleRow[] = [];
  let start = 0;
  while (start < daily.length) {
    let end = start;
    while (
      end + 1 < daily.length &&
      daily[end + 1]!.hours === daily[start]!.hours &&
      daily[end + 1]!.day === daily[end]!.day + 1
    ) end += 1;
    const first = WEEKDAYS[daily[start]!.day]!.slice(0, 3);
    const last = WEEKDAYS[daily[end]!.day]!.slice(0, 3);
    rows.push(toRow(start === end ? first : `${first}–${last}`, daily[start]!.hours, daily[start]!.day, daily[end]!.day));
    start = end + 1;
  }
  return { kind: "schedule", rows };
}
