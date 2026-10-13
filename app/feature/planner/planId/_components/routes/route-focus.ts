import type { RouteCoordinate, RouteSegment } from "./trip-route.types";

/** Mirrors `RouteLineMode` in trip-builder.atoms, kept here so this module stays pure. */
type RouteScopeMode = "all" | "day" | "stop";

export type VisibleRoutes = {
  segments: RouteSegment[];
  /** The leg drawn at full strength in "stop" mode; the rest of `segments` is faded. */
  focusedSegment: RouteSegment | null;
  /** False when nothing is in scope yet (no active day), so no route status applies. */
  hasScope: boolean;
};

/** How long scrolling has to settle on a leg before the camera moves to it. */
export const ROUTE_FOCUS_SETTLE_MS = 250;
export const ROUTE_FOCUS_PADDING_PX = 64;
/** Keeps a very short leg from zooming the camera to street level. */
export const ROUTE_FOCUS_MAX_ZOOM = 16;

/** A lng/lat box; the same shape as Google's `LatLngBoundsLiteral`. */
export type RouteBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/**
 * Below this share of the viewport a leg that is already on screen is too small
 * to read, so the camera zooms to it anyway.
 */
const MIN_LEG_VIEWPORT_SHARE = 0.2;

/** The day anchors' route ids: `${blockId}:start` and `${blockId}:end`. */
export function getAnchorStopId(blockId: string, edge: "start" | "end"): string {
  return `${blockId}:${edge}`;
}

/**
 * The leg an itinerary stop stands for: the one arriving at it. A day's first
 * stop (its Start anchor, or its first place when it has none) has no arriving
 * leg, so it stands for the one leaving it.
 */
export function getFocusedRouteSegment(
  segments: readonly RouteSegment[],
  stopId: string | null,
): RouteSegment | null {
  if (!stopId) return null;
  return (
    segments.find((segment) => segment.toItemId === stopId) ??
    segments.find((segment) => segment.fromItemId === stopId) ??
    null
  );
}

/**
 * What the planner map draws. "all": every day. "day": the active day.
 * "stop": the focused leg's whole day, with that leg singled out; until a leg
 * is focused it behaves like "day".
 */
export function getVisibleRoutes(
  segments: RouteSegment[],
  mode: RouteScopeMode,
  activeBlockId: string | null,
  focusedStopId: string | null,
): VisibleRoutes {
  if (mode === "all") return { segments, focusedSegment: null, hasScope: true };

  const focusedSegment = mode === "stop" ? getFocusedRouteSegment(segments, focusedStopId) : null;
  const blockId = focusedSegment?.blockId ?? activeBlockId;
  return {
    segments: blockId ? segments.filter((segment) => segment.blockId === blockId) : [],
    focusedSegment,
    hasScope: blockId !== null,
  };
}

/** Whether a map pin's visit is one end of the focused leg. */
export function isVisitOnSegment(
  visit: { blockId: string; edge: "start" | "stop" | "end"; itemId?: string },
  segment: RouteSegment,
): boolean {
  const stopId = visit.edge === "stop" ? visit.itemId : getAnchorStopId(visit.blockId, visit.edge);
  return stopId === segment.fromItemId || stopId === segment.toItemId;
}

export function getRouteBounds(coordinates: readonly RouteCoordinate[]): RouteBounds | null {
  const finite = coordinates.filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  if (!finite.length) return null;

  return finite.reduce<RouteBounds>(
    (bounds, [lng, lat]) => ({
      west: Math.min(bounds.west, lng),
      south: Math.min(bounds.south, lat),
      east: Math.max(bounds.east, lng),
      north: Math.max(bounds.north, lat),
    }),
    { west: finite[0][0], south: finite[0][1], east: finite[0][0], north: finite[0][1] },
  );
}

/**
 * Whether the camera should move to a focused leg: only when part of it is off
 * screen, or when it is on screen but too small to make out.
 */
export function shouldFitRouteBounds(leg: RouteBounds, view: RouteBounds | null): boolean {
  if (!view) return true;

  const isContained =
    leg.west >= view.west &&
    leg.east <= view.east &&
    leg.south >= view.south &&
    leg.north <= view.north;
  if (!isContained) return true;

  const viewWidth = view.east - view.west;
  const viewHeight = view.north - view.south;
  if (viewWidth <= 0 || viewHeight <= 0) return true;

  const share = Math.max((leg.east - leg.west) / viewWidth, (leg.north - leg.south) / viewHeight);
  return share < MIN_LEG_VIEWPORT_SHARE;
}
