import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type TripBlockData,
} from "../constants/types";
import type {
  DirectionsRequest,
  RouteLineString,
  RoutePointGroup,
  RouteSegment,
} from "./trip-route.types";

export function getTripRouteGroups(blocks: TripBlockData[]): RoutePointGroup[] {
  return blocks
    .filter((block) => block.kind !== "list")
    .map((block) => ({
      blockId: block.id,
      points: block.items.filter(isPlaceItem).map((item) => ({
        id: item.id,
        name: item.name,
        type: isEvChargerPlaceItem(item)
          ? ("charger" as const)
          : ("place" as const),
        lat: item.lat,
        lng: item.lng,
      })),
    }))
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
              `${point.id}:${point.type}:${point.lat.toFixed(6)},${point.lng.toFixed(6)}`,
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
    optionalString(value.fallbackReason)
  );
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
