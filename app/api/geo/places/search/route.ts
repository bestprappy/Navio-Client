import { NextResponse } from "next/server";

import {
  fetchGooglePlacesTextSearch,
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

    if (googleApiKey) {
      const data = await fetchGooglePlacesTextSearch({
        query: query.trim(),
        lat,
        lng,
        apiKey: googleApiKey,
      });

      return NextResponse.json(data);
    }

    if (mapboxToken) {
      const data = await fetchMapboxAutocomplete({
        query: query.trim(),
        lat,
        lng,
        sessionToken: createMapboxSessionToken(null),
        accessToken: mapboxToken,
      });

      return NextResponse.json({
        items: data.items.map((item) => item.place),
      });
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

    const upstreamUrl = `${backendBaseUrl}/v1/geo/places/search?${upstreamParams}`;
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
      console.error("Backend place search request failed.", {
        component: "GeoPlacesSearchRoute",
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
    console.error("Place search proxy failed unexpectedly.", {
      component: "GeoPlacesSearchRoute",
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
