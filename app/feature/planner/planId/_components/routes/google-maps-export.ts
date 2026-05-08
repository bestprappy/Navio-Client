import { isPlaceItem, type TripBlockData } from "../constants/types";

const GOOGLE_MAPS_DIRECTIONS_URL = "https://www.google.com/maps/dir/";
const MAX_POINTS_PER_GOOGLE_MAPS_LINK = 5;
const CHUNK_STEP = MAX_POINTS_PER_GOOGLE_MAPS_LINK - 1;

export type GoogleMapsDirectionsLink = {
  href: string;
  label: string;
  stopCount: number;
};

type GoogleMapsRoutePoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export function getGoogleMapsDirectionsLinks(
  block: TripBlockData,
): GoogleMapsDirectionsLink[] {
  const points = block.items
    .filter(isPlaceItem)
    .map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.lat,
      lng: item.lng,
    }))
    .filter(isValidRoutePoint);

  if (points.length < 2) {
    return [];
  }

  const chunks = getRouteChunks(points);

  return chunks.map((chunk, index) => ({
    href: buildDirectionsUrl(chunk),
    label: chunks.length === 1 ? "Open in Google Maps" : `Route part ${index + 1}`,
    stopCount: chunk.length,
  }));
}

function getRouteChunks(points: GoogleMapsRoutePoint[]): GoogleMapsRoutePoint[][] {
  if (points.length <= MAX_POINTS_PER_GOOGLE_MAPS_LINK) {
    return [points];
  }

  const chunks: GoogleMapsRoutePoint[][] = [];

  for (let start = 0; start < points.length - 1; start += CHUNK_STEP) {
    const chunk = points.slice(
      start,
      Math.min(start + MAX_POINTS_PER_GOOGLE_MAPS_LINK, points.length),
    );

    if (chunk.length >= 2) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

function buildDirectionsUrl(points: GoogleMapsRoutePoint[]): string {
  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1);
  const searchParams = new URLSearchParams({
    api: "1",
    origin: getCoordinateValue(origin),
    destination: getCoordinateValue(destination),
    travelmode: "driving",
  });

  if (waypoints.length > 0) {
    searchParams.set("waypoints", waypoints.map(getCoordinateValue).join("|"));
  }

  return `${GOOGLE_MAPS_DIRECTIONS_URL}?${searchParams.toString()}`;
}

function getCoordinateValue(point: GoogleMapsRoutePoint): string {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}

function isValidRoutePoint(
  point: GoogleMapsRoutePoint,
): point is GoogleMapsRoutePoint {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
}
