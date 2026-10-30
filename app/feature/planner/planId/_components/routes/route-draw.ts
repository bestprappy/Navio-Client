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
  /** Faded context: another leg of the day while one leg is focused. */
  muted: boolean;
};

/**
 * Splits route segments into the pieces both map providers draw. With a
 * focused segment, every other segment is muted and drawn first, so the
 * focused leg sits on top.
 */
export function getRouteDrawPieces(
  segments: RouteSegment[],
  /** Colours by block id, and optionally by stop id for a stop whose section has its own colour. */
  dayColorByBlockId: Map<string, string>,
  defaultColor: string,
  focusedSegmentId: string | null = null,
): RouteDrawPiece[] {
  const pieces = segments.flatMap((segment): RouteDrawPiece[] => {
    // A leg takes the colour of the section it arrives in.
    const dayColor = dayColorByBlockId.get(segment.toItemId) ?? dayColorByBlockId.get(segment.blockId) ?? defaultColor;
    const muted = focusedSegmentId !== null && segment.id !== focusedSegmentId;
    const base = { blockId: segment.blockId, color: dayColor, muted };

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

  return focusedSegmentId === null
    ? pieces
    : [...pieces.filter((piece) => piece.muted), ...pieces.filter((piece) => !piece.muted)];
}
