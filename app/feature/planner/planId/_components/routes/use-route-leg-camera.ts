"use client";

import { useEffect } from "react";

import {
  getRouteBounds,
  ROUTE_FOCUS_SETTLE_MS,
  shouldFitRouteBounds,
  type RouteBounds,
} from "./route-focus";
import type { RouteSegment } from "./trip-route.types";

/** The two camera calls each map provider supplies. */
export type RouteLegCamera = {
  getViewBounds: () => RouteBounds | null;
  fitBounds: (bounds: RouteBounds) => void;
};

/**
 * Moves the camera to the focused leg once scrolling has settled on it, and
 * only when the leg is partly off screen or too small to make out.
 *
 * <p>Keyed on the leg's bounds rather than the segment object, so a refetched
 * routes response with the same geometry does not move the camera again.
 */
export function useRouteLegCamera(
  segment: RouteSegment | null,
  enabled: boolean,
  camera: RouteLegCamera | null,
) {
  const legBounds = segment ? getRouteBounds(segment.geometry.coordinates) : null;
  const boundsKey = legBounds
    ? [legBounds.west, legBounds.south, legBounds.east, legBounds.north].join(",")
    : null;

  useEffect(() => {
    if (!camera || !enabled || !boundsKey) return;
    const [west, south, east, north] = boundsKey.split(",").map(Number);
    const bounds = { west, south, east, north };

    const timeout = window.setTimeout(() => {
      try {
        if (shouldFitRouteBounds(bounds, camera.getViewBounds())) camera.fitBounds(bounds);
      } catch (error) {
        console.error("Could not move the map to the focused leg.", {
          component: "useRouteLegCamera",
          operation: "fitRouteLeg",
          error,
        });
      }
    }, ROUTE_FOCUS_SETTLE_MS);

    return () => window.clearTimeout(timeout);
  }, [camera, enabled, boundsKey]);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
