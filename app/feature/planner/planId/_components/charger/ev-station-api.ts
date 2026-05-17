import { searchEvChargers } from "../constants/charger.data";
import { getDistanceKm } from "../constants/place.data";
import type { EvCharger } from "../constants/types";
import type { RouteSegment } from "../routes/trip-route.types";

type EvChargerApiResponse = {
  items: EvCharger[];
};

const isUsingMock = process.env.NEXT_PUBLIC_PLACE_DATA_SOURCE === "mock";

export const DEFAULT_EV_STATION_RADIUS_METERS = 10_000;

export async function fetchEvChargersNear(
  lat: number,
  lng: number,
  radiusMeters = DEFAULT_EV_STATION_RADIUS_METERS,
): Promise<EvCharger[]> {
  if (isUsingMock) {
    const radiusKm = radiusMeters / 1000;

    return searchEvChargers("").filter(
      (charger) => getDistanceKm({ lat, lng }, charger.location) <= radiusKm,
    );
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusMeters),
  });

  const response = await fetch(`/api/geo/places/ev-chargers?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`EV station request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!isEvChargerApiResponse(data)) {
    throw new Error("EV station response shape is invalid.");
  }

  return data.items;
}

export function filterEvChargers(
  chargers: EvCharger[],
  query: string,
): EvCharger[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return chargers;
  }

  return chargers.filter((charger) =>
    [
      charger.name,
      charger.operatorName,
      charger.address,
      charger.location.address,
      charger.province,
      charger.connectorTypes.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function isEvChargerApiResponse(value: unknown): value is EvChargerApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as EvChargerApiResponse).items)
  );
}

// Samples points along the actual road polyline every `intervalKm` km.
// Uses real route geometry so intermediate anchors follow the road,
// not a straight line that may cut across water or miss the highway.
export function sampleRoutePolyline(
  segments: RouteSegment[],
  blockId: string,
  intervalKm = 30,
): { id: string; lat: number; lng: number }[] {
  const blockSegments = segments.filter((s) => s.blockId === blockId);
  if (!blockSegments.length) return [];

  // Concatenate all polyline coordinates for the block into one continuous path.
  const allCoords: [number, number][] = [];
  for (const seg of blockSegments) {
    const coords = seg.geometry.coordinates; // [lng, lat][]
    if (allCoords.length === 0) {
      allCoords.push(...coords);
    } else {
      allCoords.push(...coords.slice(1)); // skip duplicate junction point
    }
  }

  const samples: { id: string; lat: number; lng: number }[] = [];
  let sinceLastSampleKm = 0;
  let sampleIndex = 0;

  for (let i = 1; i < allCoords.length; i++) {
    const prevCoord = allCoords[i - 1]!;
    const currCoord = allCoords[i]!;
    let prevPoint = { lat: prevCoord[1]!, lng: prevCoord[0]! };
    const currPoint = { lat: currCoord[1]!, lng: currCoord[0]! };
    let segRemaining = getDistanceKm(prevPoint, currPoint);

    while (sinceLastSampleKm + segRemaining >= intervalKm) {
      const needed = intervalKm - sinceLastSampleKm;
      const ratio = needed / segRemaining;
      const sampled = {
        lat: prevPoint.lat + ratio * (currPoint.lat - prevPoint.lat),
        lng: prevPoint.lng + ratio * (currPoint.lng - prevPoint.lng),
      };
      samples.push({ id: `route-sample-${sampleIndex++}`, ...sampled });
      segRemaining -= needed;
      prevPoint = sampled;
      sinceLastSampleKm = 0;
    }

    sinceLastSampleKm += segRemaining;
  }

  return samples;
}
