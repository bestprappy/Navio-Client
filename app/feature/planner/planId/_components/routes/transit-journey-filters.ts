import { getJourneyDurationSeconds, getJourneyTransfers, getJourneyWalkingSeconds, getTransitJourneyScore } from "./transit-route-choice";
import { getTransitVehicleLabel } from "./travel-options";
import type { TransitJourney } from "./trip-route.types";

export type TransitVehicleKind = "Metro" | "Train" | "Monorail" | "Tram" | "Bus" | "Ferry" | "Other";
const VEHICLE_KIND_ORDER: TransitVehicleKind[] = ["Metro", "Train", "Monorail", "Tram", "Bus", "Ferry", "Other"];

export type TransitJourneySort = "fastest" | "least-walking" | "fewest-transfers" | "lowest-fare" | "balanced";
export const TRANSIT_JOURNEY_SORTS: { value: TransitJourneySort; label: string }[] = [
  { value: "fastest", label: "Fastest" },
  { value: "least-walking", label: "Least walking" },
  { value: "fewest-transfers", label: "Fewest transfers" },
  { value: "lowest-fare", label: "Lowest fare" },
  { value: "balanced", label: "Balanced" },
];

export function getJourneyVehicleKinds(journey: TransitJourney): TransitVehicleKind[] {
  const kinds = new Set(journey.steps.filter(step => step.travelMode === "transit").map((step): TransitVehicleKind => {
    const label = getTransitVehicleLabel(step);
    return label === "Public transit" ? "Other" : label as TransitVehicleKind;
  }));
  return VEHICLE_KIND_ORDER.filter(kind => kinds.has(kind));
}

/** Only vehicles that actually appear in the found routes become filters. */
export function getAvailableVehicleKinds(journeys: TransitJourney[]): { kind: TransitVehicleKind; count: number }[] {
  const counts = new Map<TransitVehicleKind, number>();
  for (const journey of journeys) {
    for (const kind of getJourneyVehicleKinds(journey)) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return VEHICLE_KIND_ORDER.filter(kind => counts.has(kind)).map(kind => ({ kind, count: counts.get(kind)! }));
}

export function filterTransitJourneys(journeys: TransitJourney[], kind: TransitVehicleKind | null): TransitJourney[] {
  return kind ? journeys.filter(journey => getJourneyVehicleKinds(journey).includes(kind)) : journeys;
}

/** Fare sorting only helps when at least two routes publish a price. */
export function canSortByFare(journeys: TransitJourney[]): boolean {
  return journeys.filter(journey => journey.fare != null).length >= 2;
}

const SORT_METRIC: Record<TransitJourneySort, (journey: TransitJourney) => number> = {
  fastest: getJourneyDurationSeconds,
  "least-walking": getJourneyWalkingSeconds,
  "fewest-transfers": getJourneyTransfers,
  "lowest-fare": journey => journey.fare ?? Infinity,
  balanced: getTransitJourneyScore,
};

/** Ties fall back to the faster route, then the balanced score. */
export function sortTransitJourneys(journeys: TransitJourney[], sort: TransitJourneySort): TransitJourney[] {
  const metric = SORT_METRIC[sort];
  const compare = (a: number, b: number) => a === b ? 0 : a < b ? -1 : 1;
  return [...journeys].sort((a, b) => compare(metric(a), metric(b))
    || compare(getJourneyDurationSeconds(a), getJourneyDurationSeconds(b))
    || compare(getTransitJourneyScore(a), getTransitJourneyScore(b)));
}
