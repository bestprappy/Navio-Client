"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";

import {
  activeBlockIdAtom,
  focusedRouteStopIdAtom,
  routeLineModeAtom,
} from "../overview/trip-builder.atoms";
import { getVisibleRoutes, type VisibleRoutes } from "./route-focus";
import type { RouteSegment } from "./trip-route.types";
import { transitRoutePreviewAtom } from "./route-preview.atoms";

/** The routes the planner map draws for the current route mode, day and focused stop. */
export function useVisibleRoutes(segments: RouteSegment[]): VisibleRoutes {
  const mode = useAtomValue(routeLineModeAtom);
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const focusedStopId = useAtomValue(focusedRouteStopIdAtom);
  const preview = useAtomValue(transitRoutePreviewAtom);

  return useMemo(
    () => {
      if (!preview) return getVisibleRoutes(segments, mode, activeBlockId, focusedStopId);
      const otherSegments = segments.filter((segment) => segment.blockId === preview.blockId
        && !(segment.fromItemId === preview.fromItemId && segment.toItemId === preview.toItemId));
      return { segments: [...otherSegments, preview], focusedSegment: preview, hasScope: true };
    },
    [segments, mode, activeBlockId, focusedStopId, preview],
  );
}
