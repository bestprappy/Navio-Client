import { NextResponse } from "next/server";

import {
  fetchGooglePlacesNearby,
  getGooglePlacesApiKey,
} from "../google-places";

const MAX_RADIUS_METERS = 2000;
const DEFAULT_RADIUS_METERS = 800;

export async function GET(request: Request) {
  const googleApiKey = getGooglePlacesApiKey();
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusParam = searchParams.get("radius");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return NextResponse.json(
      { error: "lat and lng must be valid numbers." },
      { status: 400 },
    );
  }

  if (!googleApiKey) {
    return NextResponse.json(
      { error: "Places search is not configured." },
      { status: 503 },
    );
  }

  const radiusMeters = Math.min(
    Number(radiusParam) || DEFAULT_RADIUS_METERS,
    MAX_RADIUS_METERS,
  );

  try {
    const data = await fetchGooglePlacesNearby({
      lat,
      lng,
      radiusMeters,
      apiKey: googleApiKey,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Nearby places request failed.", {
      component: "GeoPlacesNearbyRoute",
      operation: "GET",
      lat,
      lng,
      radiusMeters,
      error,
    });

    return NextResponse.json(
      { error: "Nearby places could not be loaded." },
      { status: 500 },
    );
  }
}
