import type { TripBlockData } from "../planId/_components/constants/types";

export function getTripDestinations(initial: string, blocks: readonly TripBlockData[]): string[] {
  const days = blocks.filter((block) => block.kind === "itinerary").toSorted((a, b) => a.date.localeCompare(b.date));
  return [...new Set([days[0]?.destination?.name || initial, ...days.flatMap((day) => day.destination ? [day.destination.name] : [])])].filter(Boolean);
}
