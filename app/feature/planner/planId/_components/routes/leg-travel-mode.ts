import type { LegTravelMode } from "../constants/types";

/**
 * How each leg of a day is travelled. Mirrors trip-planning-service's `LegTravelModes`:
 * change both together so the planner and the charging optimizer agree.
 *
 * A stop's saved `arrivalMode` decides the leg ending at it. Without one the leg is
 * automatic: public transit when both ends are stations, otherwise driving.
 */

export const LEG_TRAVEL_MODES: readonly LegTravelMode[] = ["drive", "transit", "bike", "walk"];

/** Google Places primary types of stops a public transit route can start or end at. */
const STATION_TYPES = new Set([
  "subway_station",
  "train_station",
  "light_rail_station",
  "transit_station",
]);

/** Fallback for stops saved before the type was kept: the display label, e.g. "Subway Station". */
const STATION_LABEL =
  /\b(subway|metro|mrt|bts|train|railway|rail|light rail|transit)\s+station\b/i;

const RAIL_STATION_TYPES = new Set([
  "subway_station",
  "train_station",
  "light_rail_station",
]);
const RAIL_STATION_LABEL =
  /\b(subway|metro|mrt|bts|train|railway|rail|light rail)\s+station\b/i;

export type LegEndpoint = {
  placeType?: string;
  description?: string;
  arrivalMode?: LegTravelMode | null;
};

export function isLegTravelMode(value: unknown): value is LegTravelMode {
  return value === "drive" || value === "transit" || value === "rail" || value === "bus" || value === "bike" || value === "walk";
}

export function isTransitMode(mode: LegTravelMode | undefined): boolean {
  return mode === "transit" || mode === "rail" || mode === "bus";
}

export function isTransitStation(point: LegEndpoint | undefined): boolean {
  if (!point) return false;
  if (point.placeType && STATION_TYPES.has(point.placeType.toLowerCase())) return true;
  return Boolean(point.description && STATION_LABEL.test(point.description));
}

/** Generic transit stations can be bus stops; rail stations must be reached by rail. */
export function isRailStation(point: LegEndpoint | undefined): boolean {
  if (!point) return false;
  if (point.placeType && RAIL_STATION_TYPES.has(point.placeType.toLowerCase())) return true;
  return Boolean(point.description && RAIL_STATION_LABEL.test(point.description));
}

/** The mode the leg would take without the traveller's choice. */
export function automaticLegTravelMode(
  from: LegEndpoint | undefined,
  to: LegEndpoint | undefined,
): LegTravelMode {
  return isTransitStation(from) && isTransitStation(to) ? "transit" : "drive";
}

/**
 * The mode of the leg from `from` to `to`. A day's start or end anchor is passed as
 * `undefined`: anchors are never stations and carry no saved mode.
 */
export function resolveLegTravelMode(
  from: LegEndpoint | undefined,
  to: LegEndpoint | undefined,
): LegTravelMode {
  return isLegTravelMode(to?.arrivalMode)
    ? to.arrivalMode
    : automaticLegTravelMode(from, to);
}
