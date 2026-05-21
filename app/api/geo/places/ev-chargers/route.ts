import { NextResponse } from "next/server";

import {
  fetchGoogleEvChargersNearby,
  getGooglePlacesApiKey,
} from "../google-places";

const MAX_RADIUS_METERS = 50_000;
const DEFAULT_RADIUS_METERS = 10_000;

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
      { error: "EV station search is not configured." },
      { status: 503 },
    );
  }

  const radiusMeters = Math.min(
    Number(radiusParam) || DEFAULT_RADIUS_METERS,
    MAX_RADIUS_METERS,
  );

  try {
    const data = await fetchGoogleEvChargersNearby({
      lat,
      lng,
      radiusMeters,
      apiKey: googleApiKey,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Google EV charger request failed.", {
      component: "GeoPlacesEvChargersRoute",
      operation: "GET",
      lat,
      lng,
      radiusMeters,
      error,
    });

    return NextResponse.json(
      { error: "EV stations could not be loaded." },
      { status: 500 },
    );
  }
}
