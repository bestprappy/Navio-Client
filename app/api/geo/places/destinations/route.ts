import { NextResponse } from "next/server";

import {
  fetchGooglePlacesAutocomplete,
  getGooglePlacesApiKey,
} from "../google-places";
import {
  createMapboxSessionToken,
  fetchMapboxAutocomplete,
  getMapboxSearchToken,
} from "../mapbox-search";

const GOOGLE_DESTINATION_TYPES = [
  "locality",
  "administrative_area_level_1",
  "country",
];

const MAPBOX_DESTINATION_TYPES = "place,region,country";

export async function GET(request: Request) {
  const googleApiKey = getGooglePlacesApiKey();
  const mapboxToken = getMapboxSearchToken();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query?.trim()) {
    return NextResponse.json(
      { error: "query parameter is required." },
      { status: 400 },
    );
  }

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const sessionToken = createMapboxSessionToken(
    searchParams.get("sessionToken"),
  );

  try {
    if (googleApiKey) {
      const data = await fetchGooglePlacesAutocomplete({
        query: query.trim(),
        lat,
        lng,
        sessionToken,
        apiKey: googleApiKey,
        includedPrimaryTypes: GOOGLE_DESTINATION_TYPES,
      });

      return NextResponse.json(data);
    }

    if (mapboxToken) {
      const data = await fetchMapboxAutocomplete({
        query: query.trim(),
        lat,
        lng,
        sessionToken,
        accessToken: mapboxToken,
        types: MAPBOX_DESTINATION_TYPES,
      });

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Destination search is not configured." },
      { status: 503 },
    );
  } catch (error) {
    console.error("Destination search failed.", {
      component: "GeoPlacesDestinationsRoute",
      operation: "GET",
      query,
      error,
    });

    return NextResponse.json(
      { error: "Destination search could not be completed." },
      { status: 500 },
    );
  }
}
