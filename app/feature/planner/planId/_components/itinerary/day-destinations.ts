import type { TripBlockData, TripDestination } from "../constants/types";

/** Resolve chronological destination changes without moving or deleting stops. */
export function resolveDayDestinations(
  blocks: TripBlockData[],
  initialDestination: TripDestination,
): Map<string, TripDestination> {
  const destinations = new Map<string, TripDestination>();
  let current = initialDestination;
  for (const block of blocks.filter((item) => item.kind === "itinerary").toSorted((a, b) => a.date.localeCompare(b.date))) {
    if (block.destination) current = block.destination;
    destinations.set(block.id, current);
  }
  return destinations;
}

export function isTripDestination(value: unknown): value is TripDestination {
  if (typeof value !== "object" || value === null) return false;
  const destination = value as Record<string, unknown>;
  return typeof destination.id === "string" && destination.id.length > 0 &&
    typeof destination.name === "string" && destination.name.trim().length > 0 &&
    typeof destination.lat === "number" && Number.isFinite(destination.lat) && Math.abs(destination.lat) <= 90 &&
    typeof destination.lng === "number" && Number.isFinite(destination.lng) && Math.abs(destination.lng) <= 180 &&
    (destination.country === undefined || destination.country === null || typeof destination.country === "string");
}

/** Provider search is biased, so suggestions also check the destination address. */
export function matchesDestination(address: string, destinationName: string): boolean {
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const area = normalize(destinationName.split(",")[0]);
  const normalizedAddress = normalize(address);
  return area.length > 0 && (` ${normalizedAddress} `).includes(` ${area} `);
}
