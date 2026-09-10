export type OpeningHoursRow = { days: string; hours: string };
export type OpeningHoursDisplay = { summary: string; rows: OpeningHoursRow[] };

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_PATTERN = "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday";

function cleanHours(value: string): string {
  const normalized = value.replace(/[\u202f\u00a0]/g, " ").replace(/\s+/g, " ").trim();
  if (/^(?:open\s+)?24\s*(?:hours?|hrs?)$|^24\/7$/i.test(normalized)) return "Open 24 hours";
  if (/^closed$/i.test(normalized)) return "Closed";
  return normalized.replace(/\s*[–—]\s*/g, " – ");
}

/** Keep provider text intact when it cannot be confidently parsed. */
export function formatOpeningHours(value?: string | null): OpeningHoursDisplay {
  if (!value?.trim()) return { summary: "Hours unavailable", rows: [] };
  const normalized = value.replace(/[\u202f\u00a0]/g, " ").trim();
  if (/^(?:open\s+)?24\s*(?:hours?|hrs?)(?:\s+(?:every\s*day|daily))?$|^24\/7$/i.test(normalized)) {
    return { summary: "Open 24 hours, every day", rows: [] };
  }

  const pattern = new RegExp(`(${DAY_PATTERN}):\\s*([\\s\\S]*?)(?=(?:\\s*[|;\\n]\\s*|\\s+)(?:${DAY_PATTERN}):|$)`, "gi");
  const matches = [...normalized.matchAll(pattern)];
  if (matches.length === 0) return { summary: cleanHours(normalized), rows: [] };

  const daily = matches.map((match) => ({
    day: WEEKDAYS.find((day) => day.toLowerCase() === match[1]!.toLowerCase())!,
    hours: cleanHours(match[2]!.replace(/[|;\s]+$/, "")),
  }));
  if (daily.some((row) => !row.hours)) return { summary: normalized, rows: [] };
  const isFullWeek = new Set(daily.map((row) => row.day)).size === 7;
  if (isFullWeek && daily.every((row) => row.hours === "Open 24 hours")) {
    return { summary: "Open 24 hours, every day", rows: [] };
  }
  if (isFullWeek && daily.every((row) => row.hours === daily[0]!.hours)) {
    return { summary: daily[0]!.hours === "Closed" ? "Closed every day" : `Daily · ${daily[0]!.hours}`, rows: [] };
  }

  const rows: OpeningHoursRow[] = [];
  let start = 0;
  while (start < daily.length) {
    let end = start;
    while (
      end + 1 < daily.length &&
      daily[end + 1]!.hours === daily[start]!.hours &&
      WEEKDAYS.indexOf(daily[end + 1]!.day) === WEEKDAYS.indexOf(daily[end]!.day) + 1
    ) end += 1;
    rows.push({
      days: start === end ? daily[start]!.day.slice(0, 3) : `${daily[start]!.day.slice(0, 3)}–${daily[end]!.day.slice(0, 3)}`,
      hours: daily[start]!.hours,
    });
    start = end + 1;
  }
  return { summary: "Opening hours", rows };
}
