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

export async function GET(request: Request) {
  const backendBaseUrl = process.env.NAVIO_API_BASE_URL;
  const googleApiKey = getGooglePlacesApiKey();
  const mapboxToken = getMapboxSearchToken();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const sessionToken = createMapboxSessionToken(
      searchParams.get("sessionToken"),
    );

    if (googleApiKey) {
      const data = await fetchGooglePlacesAutocomplete({
        query: query.trim(),
        lat,
        lng,
        sessionToken,
        apiKey: googleApiKey,
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
      });

      return NextResponse.json(data);
    }

    if (!backendBaseUrl) {
      return NextResponse.json(
        { error: "Place search is not configured." },
        { status: 503 },
      );
    }

    const upstreamParams = new URLSearchParams({ query: query.trim() });

    if (lat) upstreamParams.set("lat", lat);
    if (lng) upstreamParams.set("lng", lng);

    const upstreamUrl = `${backendBaseUrl}/v1/geo/places/autocomplete?${upstreamParams}`;
    const authorization = request.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authorization) {
      headers["Authorization"] = authorization;
    }

    const response = await fetch(upstreamUrl, {
      headers,
      cache: "no-store",
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      console.error("Backend autocomplete request failed.", {
        component: "GeoPlacesAutocompleteRoute",
        operation: "GET",
        status: response.status,
        query,
      });

      return NextResponse.json(
        { error: "Place search is temporarily unavailable." },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Autocomplete proxy failed unexpectedly.", {
      component: "GeoPlacesAutocompleteRoute",
      operation: "GET",
      query,
      error,
    });

    return NextResponse.json(
      { error: "Place search could not be completed." },
      { status: 500 },
    );
  }
}
