import type { PlaceSearchResult } from "../constants/types";
import { isTransitStation } from "./leg-travel-mode";

/**
 * Google's TransitLayer redraws station icons without click targets, so a click on a
 * station while transit lines are shown arrives with no place id. These helpers find
 * the station from the click position instead.
 */

// Below this zoom one click covers too much ground to mean a single station.
const MIN_STATION_ZOOM = 14;
// About a station icon plus the start of its label.
const STATION_HIT_RADIUS_PX = 40;
const MIN_STATION_HIT_RADIUS_M = 20;
// Web Mercator ground resolution at zoom 0 on the equator.
const METERS_PER_PX_AT_ZOOM_0 = 156_543.03392;

/** Search radius for a click at this latitude and zoom, or null when zoomed too far out. */
export function stationHitRadiusMeters(lat: number, zoom: number): number | null {
  if (!Number.isFinite(zoom) || zoom < MIN_STATION_ZOOM) return null;
  const metersPerPx = (METERS_PER_PX_AT_ZOOM_0 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  return Math.max(MIN_STATION_HIT_RADIUS_M, Math.round(STATION_HIT_RADIUS_PX * metersPerPx));
}

/** The first station in distance-ranked nearby results. */
export function nearestTransitStation(places: PlaceSearchResult[]): PlaceSearchResult | null {
  return (
    places.find((place) =>
      isTransitStation({ placeType: place.primaryType, description: place.category }),
    ) ?? null
  );
}
