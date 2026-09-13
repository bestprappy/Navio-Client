import type { TripAnchor } from "../constants/types";
import type { ResolvedDayAnchors } from "./day-anchors";

/** One job a map location does in the trip, e.g. "Day 1 · End, stop 6". */
export type AnchorMarkerRole = {
  key: string;
  blockId: string;
  day: number;
  edge: "start" | "end";
  number: number;
  name: string;
};

/** A single pin on the map, carrying every role that lands on its spot. */
export type AnchorMarker = {
  key: string;
  lat: number;
  lng: number;
  roles: AnchorMarkerRole[];
};

// ~1 m. Close enough that two pins would render on top of each other, loose
// enough to absorb float noise between a saved place and a carried-over copy.
const COORDINATE_PRECISION = 5;

function locationKey({ lat, lng }: TripAnchor): string {
  return `${lat.toFixed(COORDINATE_PRECISION)},${lng.toFixed(COORDINATE_PRECISION)}`;
}

/**
 * Turns each day's start/end anchors into map pins, merging anchors that share
 * a location.
 *
 * An overnight stay is both where one day ends and where the next begins.
 * Drawing it twice stacks identical pins, hiding one role and swallowing its
 * clicks, so one pin names every role instead.
 */
export function buildAnchorMarkers(
  dayAnchors: Map<string, ResolvedDayAnchors>,
  placeCountByBlockId: Map<string, number>,
): AnchorMarker[] {
  const markers = new Map<string, AnchorMarker>();

  Array.from(dayAnchors).forEach(([blockId, anchors], index) => {
    const placeCount = placeCountByBlockId.get(blockId) ?? 0;
    for (const edge of ["start", "end"] as const) {
      const anchor = anchors[edge];
      if (!anchor) continue;

      const role: AnchorMarkerRole = {
        key: `${blockId}-${edge}`,
        blockId,
        day: index + 1,
        edge,
        number: edge === "start" ? 1 : placeCount + (anchors.start ? 2 : 1),
        name: anchor.name,
      };
      const key = locationKey(anchor);
      const existing = markers.get(key);
      if (existing) {
        existing.roles.push(role);
      } else {
        markers.set(key, { key, lat: anchor.lat, lng: anchor.lng, roles: [role] });
      }
    }
  });

  return Array.from(markers.values());
}

/** Counts the numbered (non-charger) places per day for end-stop numbering. */
export function countPlacesByBlockId(
  markers: readonly { blockId: string; isEvCharger?: boolean }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const marker of markers) {
    if (marker.isEvCharger) continue;
    counts.set(marker.blockId, (counts.get(marker.blockId) ?? 0) + 1);
  }
  return counts;
}

/** Puts the active day's role first so the pin face reflects the day in focus. */
export function orderRolesForActiveBlock(
  roles: readonly AnchorMarkerRole[],
  activeBlockId: string | null | undefined,
): AnchorMarkerRole[] {
  const active = roles.filter((role) => role.blockId === activeBlockId);
  return active.length ? [...active, ...roles.filter((role) => role.blockId !== activeBlockId)] : [...roles];
}
