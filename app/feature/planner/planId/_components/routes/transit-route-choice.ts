import type { DirectionsRequest, DirectionsResponse, RouteSegment, RouteStep, TransitJourney } from "./trip-route.types";

/** Stable across timetable changes: choose a line/station sequence, not a departure ID. */
export function getTransitRouteKey(steps: RouteStep[]): string | null {
  const rides = steps.filter(step => step.travelMode === "transit");
  if (!rides.length || rides.length > 16 || rides.some(step => !step.departureStop || !step.arrivalStop)) return null;
  const sequence = rides.map(step => [step.line?.vehicleType?.toUpperCase() ?? null,
    step.line?.name ?? null, step.line?.shortName ?? null, step.departureStop ?? null, step.arrivalStop ?? null]);
  if (sequence.some(ride => ride.some(field => field != null && field.length > 200))) return null;
  const key = `v1:${JSON.stringify(sequence)}`;
  return key.length <= 4096 ? key : null;
}

export function isTransitRouteKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096 || !value.startsWith("v1:")) return false;
  try {
    const rides: unknown = JSON.parse(value.slice(3));
    return Array.isArray(rides) && rides.length > 0 && rides.length <= 16 && rides.every(ride => Array.isArray(ride)
      && ride.length === 5 && ride.every((field: unknown) => field === null || (typeof field === "string" && field.length <= 200)));
  } catch { return false; }
}

export function getJourneyDurationSeconds(journey: TransitJourney): number {
  const moving = journey.steps.reduce((sum, step) => sum + (step.durationSeconds ?? 0), 0);
  return journey.durationSeconds ?? (moving > 0 ? moving : Infinity);
}

export function getJourneyWalkingSeconds(journey: TransitJourney): number {
  return journey.walkingSeconds ?? journey.steps.filter(step => step.travelMode === "walk")
    .reduce((sum, step) => sum + (step.durationSeconds ?? 0), 0);
}

export function getJourneyTransfers(journey: TransitJourney): number {
  return Math.max(0, journey.steps.filter(step => step.travelMode === "transit").length - 1);
}

/** Balanced effort: walking counts twice; each transfer adds two minutes of effort. */
export function getTransitJourneyScore(journey: TransitJourney): number {
  return getJourneyDurationSeconds(journey) + getJourneyWalkingSeconds(journey) + getJourneyTransfers(journey) * 120;
}

export function rankTransitJourneys(journeys: TransitJourney[]): TransitJourney[] {
  const unique = new Map<string, TransitJourney>();
  for (const journey of journeys) {
    const key = getTransitRouteKey(journey.steps) ?? `${journey.provider}:${journey.id}`;
    const previous = unique.get(key);
    if (!previous || getTransitJourneyScore(journey) < getTransitJourneyScore(previous)) unique.set(key, journey);
  }
  return [...unique.values()].sort((a, b) => getTransitJourneyScore(a) - getTransitJourneyScore(b));
}

/** Some providers omit the confirmed primary route from their alternatives list. */
export function getConfirmedTransitJourneys(segment: RouteSegment): TransitJourney[] {
  const journeys = segment.journeys ?? [];
  const key = segment.status === "routed" ? getTransitRouteKey(segment.steps ?? []) : null;
  if (!key || journeys.some(journey => getTransitRouteKey(journey.steps) === key)) return journeys;
  return [...journeys, { id: `${segment.id}:primary`, provider: "unknown", geometry: segment.geometry,
    distanceMeters: segment.distanceMeters, durationSeconds: segment.durationSeconds, steps: segment.steps! }];
}

function getLineId(vehicleType: string | null, name: string | null, shortName: string | null): string {
  return JSON.stringify([vehicleType, name, shortName]);
}

/** Prefer journeys on the same lines (e.g. another boarding stop), then the best balanced one. */
function getClosestTransitJourney(journeys: TransitJourney[], key: string): TransitJourney | undefined {
  const saved = new Set((JSON.parse(key.slice(3)) as (string | null)[][]).map(([type, name, shortName]) => getLineId(type, name, shortName)));
  const shared = (journey: TransitJourney) => journey.steps.filter(step => step.travelMode === "transit"
    && saved.has(getLineId(step.line?.vehicleType?.toUpperCase() ?? null, step.line?.name ?? null, step.line?.shortName ?? null))).length;
  return rankTransitJourneys(journeys).reduce<TransitJourney | undefined>((best, journey) =>
    !best || shared(journey) > shared(best) ? journey : best, undefined);
}

/**
 * Transit searches use the current departure, so a saved line/station sequence can drop out
 * of the provider's alternatives. Show the closest current journey, flagged, rather than
 * hiding every confirmed route; never swap it in silently.
 */
export function applySavedTransitRoutes(request: DirectionsRequest, response: DirectionsResponse): DirectionsResponse {
  const choices = new Map(request.groups.flatMap(group => group.points.slice(1).filter(point => point.arrivalRouteKey)
    .map(point => [JSON.stringify([group.blockId, point.id]), point.arrivalRouteKey] as const)));
  return { segments: response.segments.map(segment => {
    const key = choices.get(JSON.stringify([segment.blockId, segment.toItemId]));
    if (!key) return segment;
    const journeys = getConfirmedTransitJourneys(segment);
    const exact = journeys.find(item => getTransitRouteKey(item.steps) === key);
    const journey = exact ?? (isTransitRouteKey(key) ? getClosestTransitJourney(journeys, key) : undefined);
    if (journey) return { ...segment, status: "routed", geometry: journey.geometry,
      distanceMeters: journey.distanceMeters, durationSeconds: journey.durationSeconds, steps: journey.steps, fallbackReason: null,
      ...(exact ? {} : { savedRouteUnavailable: true }) };
    return { ...segment, status: "fallback", durationSeconds: null, distanceMeters: null, steps: [],
      geometry: { type: "LineString", coordinates: [segment.geometry.coordinates[0], segment.geometry.coordinates.at(-1)!] },
      fallbackReason: "Your selected transit route is not available" };
  }) };
}
