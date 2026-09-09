import { addDays, format, isValid, parseISO } from "date-fns";
import type { TripBlockData } from "../constants/types";
import { getTripBlockColorByIndex } from "../constants/trip-block-colors";

/** Fill missing dates without replacing, moving or deleting any existing stops. */
export function ensureItineraryDays(blocks: TripBlockData[], from?: string, to?: string): TripBlockData[] {
  if (!from) return blocks;
  const start = parseISO(from);
  const end = parseISO(to || from);
  if (!isValid(start) || !isValid(end) || end < start) return blocks;
  const dates = new Set(blocks.filter((block) => block.kind === "itinerary").map((block) => block.date));
  const additions: TripBlockData[] = [];
  for (let day = start, index = 0; day <= end && index < 3660; day = addDays(day, 1), index++) {
    const date = format(day, "yyyy-MM-dd");
    if (!dates.has(date)) additions.push({ id: `day-${date}`, kind: "itinerary", title: date, date, colorId: getTripBlockColorByIndex(index), items: [] });
  }
  if (!additions.length) return blocks;
  return [...blocks, ...additions].sort((a, b) => a.kind === b.kind ? a.date.localeCompare(b.date) : a.kind === "list" ? -1 : 1);
}
