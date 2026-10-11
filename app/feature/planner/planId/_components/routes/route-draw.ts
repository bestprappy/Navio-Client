import { getSegmentTravelMode, safeLineColor } from "./trip-route.helpers";
import type { RouteCoordinate, RouteSegment } from "./trip-route.types";

/**
 * How one piece of a route is drawn:
 * - `drive`: solid line in the day's colour
 * - `ride`: a transit ride in its line's colour, cased so it reads over the day's colour
 * - `walk`: dotted line in the day's colour
 * - `fallback`: dashed straight line where no route was found
 */
export type RouteDrawKind = "drive" | "ride" | "walk" | "fallback";

export type RouteDrawPiece = {
  id: string;
  blockId: string;
  kind: RouteDrawKind;
  color: string;
  coordinates: RouteCoordinate[];
};

/** Splits route segments into the pieces both map providers draw. */
export function getRouteDrawPieces(
  segments: RouteSegment[],
  dayColorByBlockId: Map<string, string>,
  defaultColor: string,
): RouteDrawPiece[] {
  return segments.flatMap((segment): RouteDrawPiece[] => {
    const dayColor = dayColorByBlockId.get(segment.blockId) ?? defaultColor;
    const base = { blockId: segment.blockId, color: dayColor };

    if (segment.status === "fallback") {
      return [{ ...base, id: segment.id, kind: "fallback", coordinates: segment.geometry.coordinates }];
    }

    const mode = getSegmentTravelMode(segment);
    if (mode === "drive") {
      return [{ ...base, id: segment.id, kind: "drive", coordinates: segment.geometry.coordinates }];
    }
    if (mode === "walk") {
      return [{ ...base, id: segment.id, kind: "walk", coordinates: segment.geometry.coordinates }];
    }

    const steps = (segment.steps ?? []).filter((step) => step.geometry.coordinates.length >= 2);
    if (!steps.length) {
      return [{ ...base, id: segment.id, kind: "ride", coordinates: segment.geometry.coordinates }];
    }
    return steps.map((step, index) => ({
      ...base,
      id: `${segment.id}:${index}`,
      kind: step.travelMode === "transit" ? "ride" : "walk",
      color: step.travelMode === "transit" ? (safeLineColor(step.line?.color) ?? dayColor) : dayColor,
      coordinates: step.geometry.coordinates,
    }));
  });
}
