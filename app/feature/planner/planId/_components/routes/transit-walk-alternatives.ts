import { getTransitRouteKey, rankTransitJourneys } from "./transit-route-choice";
import type { RoutePoint, RouteSegment, RouteStep, TransitJourney } from "./trip-route.types";

type WalkRouter = (from: RoutePoint, to: RoutePoint) => Promise<RouteSegment | null>;

function distanceMeters(from: [number, number], to: RoutePoint): number {
  const radians = Math.PI / 180;
  const deltaLat = (to.lat - from[1]) * radians;
  const deltaLng = (to.lng - from[0]) * radians;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(from[1] * radians) * Math.cos(to.lat * radians) * Math.sin(deltaLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Keep a confirmed ride, then test whether walking from an earlier stop is a viable alternative. */
export async function addWalkFinishAlternatives(segment: RouteSegment, to: RoutePoint, routeWalk: WalkRouter, preferredKey?: string): Promise<RouteSegment> {
  const journeys = segment.journeys ?? [];
  const existing = new Set(journeys.map(journey => getTransitRouteKey(journey.steps)));
  const candidates = new Map<string, { journey: TransitJourney; prefix: RouteStep[]; ride: RouteStep; key: string }>();
  for (const journey of journeys) {
    journey.steps.forEach((ride, index) => {
      if (ride.travelMode !== "transit" || !ride.arrivalLocation || !ride.arrivalStop
        || !journey.steps.slice(index + 1).some(step => step.travelMode === "transit")) return;
      const prefix = journey.steps.slice(0, index + 1);
      const key = getTransitRouteKey(prefix);
      if (!key || existing.has(key) || (preferredKey && key !== preferredKey) || distanceMeters(ride.arrivalLocation, to) > 1800) return;
      if (!candidates.has(key)) candidates.set(key, { journey, prefix, ride, key });
    });
  }
  const added: TransitJourney[] = [];
  // Bound extra provider calls. A nearby stop is only a candidate until the street walk is confirmed.
  for (const { journey, prefix, ride, key } of [...candidates.values()].slice(0, 2)) {
    try {
      const coordinate = ride.arrivalLocation!;
      const walk = await routeWalk({ id: "walk-finish", name: ride.arrivalStop!, type: "place", lat: coordinate[1], lng: coordinate[0] }, to);
      if (!walk || walk.status !== "routed" || walk.travelMode !== "walk" || walk.distanceMeters == null
        || walk.distanceMeters > 2500 || walk.durationSeconds == null || walk.durationSeconds > 1800) continue;
      const finalWalk: RouteStep = { travelMode: "walk", geometry: walk.geometry, distanceMeters: walk.distanceMeters, durationSeconds: walk.durationSeconds };
      const steps = [...prefix, finalWalk];
      const moving = steps.reduce((sum, step) => sum + (step.durationSeconds ?? 0), 0);
      const start = journey.departureTime ? Date.parse(journey.departureTime) : NaN;
      const rideEnd = ride.arrivalTime ? Date.parse(ride.arrivalTime) : NaN;
      const elapsed = Number.isFinite(start) && Number.isFinite(rideEnd) && rideEnd >= start ? (rideEnd - start) / 1000 + walk.durationSeconds : moving;
      added.push({ ...journey, id: `walk-finish:${journey.id}:${key}`, steps,
        geometry: { type: "LineString", coordinates: steps.flatMap(step => step.geometry.coordinates) },
        distanceMeters: steps.every(step => step.distanceMeters != null) ? steps.reduce((sum, step) => sum + step.distanceMeters!, 0) : null,
        durationSeconds: elapsed, walkingSeconds: steps.filter(step => step.travelMode === "walk").reduce((sum, step) => sum + (step.durationSeconds ?? 0), 0),
        arrivalTime: Number.isFinite(rideEnd) ? new Date(rideEnd + walk.durationSeconds * 1000).toISOString() : null,
        // The published fare for the full journey cannot be reused for a shorter ride.
        fare: null, currency: null });
    } catch { /* An unavailable walking connection cannot hide confirmed transit journeys. */ }
  }
  return added.length ? { ...segment, journeys: rankTransitJourneys([...journeys, ...added]) } : segment;
}
