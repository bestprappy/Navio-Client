import { isTransitMode } from "./leg-travel-mode";
import type { RouteCoordinate, RouteSegment, RouteStep, TransitJourney } from "./trip-route.types";

export function formatTransitClock(value?: string | null, timeZone?: string | null): string | null {
  if (!value || !Number.isFinite(new Date(value).getTime())) return null;
  try { return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false, ...(timeZone ? { timeZone } : {}) }).format(new Date(value)); }
  catch { return null; }
}

export function formatTransitFare(journey: TransitJourney): string | null {
  if (journey.fare == null || journey.fare < 0 || !journey.currency || !/^[A-Z]{3}$/.test(journey.currency)) return null;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: journey.currency }).format(journey.fare);
}

export function getWalkInstruction(steps: RouteStep[], index: number, destinationName?: string): string {
  const nextRide = steps.slice(index + 1).find((step) => step.travelMode === "transit");
  if (nextRide?.departureStop) {
    const name = nextRide.departureStop;
    const suffix = /station|stop|pier|terminal/i.test(name) ? "" : nextRide.line?.vehicleType?.includes("BUS") ? " bus stop" : nextRide.line?.vehicleType === "FERRY" ? " pier" : " Station";
    return `Walk to ${name}${suffix}`;
  }
  return destinationName ? `Walk to ${destinationName}` : "Walk to your destination";
}

export function journeyAsSegment(journey: TransitJourney, source: RouteSegment): RouteSegment {
  return { ...source, status: "routed", geometry: journey.geometry,
    distanceMeters: journey.distanceMeters, durationSeconds: journey.durationSeconds, steps: journey.steps, fallbackReason: null };
}

export type TransitStopMarker = { id: string; name: string; coordinate: RouteCoordinate; vehicleType?: string | null; lineColor?: string | null; role: "Board" | "Get off" | "Transfer" };

export function getTransitStopMarkers(segments: RouteSegment[]): TransitStopMarker[] {
  const markers = new Map<string, TransitStopMarker>();
  for (const segment of segments) {
    if (segment.status !== "routed" || !isTransitMode(segment.travelMode)) continue;
    for (const step of segment.steps ?? []) {
      if (step.travelMode !== "transit") continue;
      for (const end of ["departure", "arrival"] as const) {
        const name = end === "departure" ? step.departureStop : step.arrivalStop;
        const coordinate = end === "departure" ? step.departureLocation : step.arrivalLocation;
        if (!name || !coordinate || !coordinate.every(Number.isFinite)) continue;
        const key = `${segment.id}:${coordinate[0].toFixed(5)},${coordinate[1].toFixed(5)}:${name}`;
        const previous = markers.get(key);
        markers.set(key, { id: key, name, coordinate, vehicleType: step.line?.vehicleType,
          lineColor: step.line?.color, role: previous ? "Transfer" : end === "departure" ? "Board" : "Get off" });
      }
    }
  }
  return [...markers.values()];
}
