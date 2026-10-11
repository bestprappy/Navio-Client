import { resolveDayAnchors } from "../itinerary/day-anchors";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type PlaceItem,
  type TripBlockData,
} from "../constants/types";
import { isLegTravelMode, resolveLegTravelMode } from "./leg-travel-mode";
import type {
  DirectionsRequest,
  RouteLineString,
  RoutePointGroup,
  RoutePoint,
  RouteSegment,
  RouteStep,
} from "./trip-route.types";

export function getTripRouteGroups(blocks: TripBlockData[]): RoutePointGroup[] {
  const anchors = resolveDayAnchors(blocks);
  return blocks
    .filter((block) => block.kind !== "list")
    .map((block) => {
      const day = anchors.get(block.id);
      // Anchors take part as `undefined`: never stations, never a saved mode.
      const stops: { point: RoutePoint; item?: PlaceItem }[] = block.items
        .filter(isPlaceItem)
        .map((item) => ({
          item,
          point: {
            id: item.id, name: item.name,
            type: isEvChargerPlaceItem(item) ? "charger" : "place",
            lat: item.lat, lng: item.lng,
          },
        }));
      if (day?.start) stops.unshift({ point: { ...day.start, id: `${block.id}:start`, type: "place" } });
      if (day?.end) stops.push({ point: { ...day.end, id: `${block.id}:end`, type: "place" } });
      const points = stops.map(({ point, item }, index) => {
        const mode = index === 0 ? "drive" : resolveLegTravelMode(stops[index - 1].item, item);
        // Driving is the default, so only other modes are sent.
        return mode === "drive" ? point : { ...point, arrivalMode: mode };
      });
      return { blockId: block.id, points };
    })
    .filter((group) => group.points.length >= 2);
}

export function getTripRouteSignature(groups: RoutePointGroup[]): string {
  return groups
    .map((group) =>
      [
        group.blockId,
        group.points
          .map(
            (point) =>
              `${point.id}:${point.type}:${point.arrivalMode ?? "drive"}:${point.lat.toFixed(6)},${point.lng.toFixed(6)}`,
          )
          .join(">"),
      ].join("="),
    )
    .join("|");
}

export function getRouteSegmentByToItemId(
  segments: RouteSegment[],
): Map<string, RouteSegment> {
  return new Map(segments.map((segment) => [segment.toItemId, segment]));
}

export function formatRouteDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) {
    return "Travel time unavailable";
  }

  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${totalMinutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatRouteDistance(meters?: number | null): string {
  if (!meters || meters <= 0) {
    return "Distance unavailable";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export function isRouteLineString(value: unknown): value is RouteLineString {
  if (!isRecord(value) || value.type !== "LineString") {
    return false;
  }

  return (
    Array.isArray(value.coordinates) &&
    value.coordinates.every(
      (coordinate) =>
        Array.isArray(coordinate) &&
        coordinate.length === 2 &&
        coordinate.every((item) => typeof item === "number"),
    )
  );
}

export function isDirectionsRequest(
  value: unknown,
): value is DirectionsRequest & { segments?: never } {
  return isRecord(value) && Array.isArray(value.groups);
}

export function isRouteSegmentsResponse(
  value: unknown,
): value is { segments: RouteSegment[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.segments) &&
    value.segments.every(isRouteSegment)
  );
}

function isRouteSegment(value: unknown): value is RouteSegment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.blockId === "string" &&
    typeof value.fromItemId === "string" &&
    typeof value.toItemId === "string" &&
    typeof value.fromName === "string" &&
    typeof value.toName === "string" &&
    (value.status === "routed" || value.status === "fallback") &&
    isRouteLineString(value.geometry) &&
    optionalNumber(value.distanceMeters) &&
    optionalNumber(value.durationSeconds) &&
    optionalString(value.fallbackReason) &&
    (value.travelMode === undefined || isLegTravelMode(value.travelMode)) &&
    (value.steps === undefined || (Array.isArray(value.steps) && value.steps.every(isRouteStep)))
  );
}

function isRouteStep(value: unknown): value is RouteStep {
  return (
    isRecord(value) &&
    isLegTravelMode(value.travelMode) &&
    isRouteLineString(value.geometry) &&
    optionalNumber(value.distanceMeters) &&
    optionalNumber(value.durationSeconds) &&
    optionalString(value.departureStop) &&
    optionalString(value.arrivalStop) &&
    optionalNumber(value.stopCount) &&
    (value.line == null ||
      (isRecord(value.line) &&
        optionalString(value.line.name) &&
        optionalString(value.line.shortName) &&
        optionalString(value.line.color) &&
        optionalString(value.line.textColor) &&
        optionalString(value.line.vehicleType)))
  );
}

/** A line colour is used as a style value, so only plain hex colours are accepted. */
export function safeLineColor(color?: string | null): string | null {
  return color && /^#(?:[0-9a-f]{3}){1,2}$/i.test(color) ? color : null;
}

/** The leg's mode, treating segments from older mobility releases as driving. */
export function getSegmentTravelMode(segment: RouteSegment): "drive" | "transit" | "walk" {
  return segment.travelMode ?? "drive";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalNumber(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "undefined" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function optionalString(value: unknown): boolean {
  return (
    value === null || typeof value === "undefined" || typeof value === "string"
  );
}
