import { NextResponse } from "next/server";

import {
  fetchGooglePlaceDetail,
  getGooglePlacesApiKey,
} from "../google-places";
import {
  fetchMapboxPlaceDetail,
  getMapboxSearchToken,
} from "../mapbox-search";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ providerPlaceId: string }> },
) {
  const backendBaseUrl = process.env.NAVIO_API_BASE_URL;
  const googleApiKey = getGooglePlacesApiKey();
  const mapboxToken = getMapboxSearchToken();

  const { providerPlaceId } = await params;

  if (!providerPlaceId) {
    return NextResponse.json(
      { error: "providerPlaceId path parameter is required." },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const sessionToken = searchParams.get("sessionToken");

  try {
    if (provider === "GOOGLE" || (!provider && googleApiKey)) {
      if (!googleApiKey) {
        return NextResponse.json(
          { error: "Google Places search is not configured." },
          { status: 503 },
        );
      }

      const data = await fetchGooglePlaceDetail({
        providerPlaceId,
        apiKey: googleApiKey,
      });

      return NextResponse.json(data);
    }

    if (provider === "MAPBOX") {
      if (!mapboxToken) {
        return NextResponse.json(
          { error: "Mapbox place search is not configured." },
          { status: 503 },
        );
      }

      if (!sessionToken?.trim()) {
        return NextResponse.json(
          { error: "sessionToken query parameter is required." },
          { status: 400 },
        );
      }

      const data = await fetchMapboxPlaceDetail({
        providerPlaceId,
        sessionToken,
        accessToken: mapboxToken,
      });

      return NextResponse.json(data);
    }

    if (!backendBaseUrl) {
      return NextResponse.json(
        { error: "Place details are not configured." },
        { status: 503 },
      );
    }

    const upstreamParams = new URLSearchParams();

    if (provider) {
      upstreamParams.set("provider", provider);
    }

    const encodedId = encodeURIComponent(providerPlaceId);
    const upstreamUrl = `${backendBaseUrl}/v1/geo/places/${encodedId}?${upstreamParams}`;
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
      console.error("Backend place detail request failed.", {
        component: "GeoPlacesDetailRoute",
        operation: "GET",
        status: response.status,
        providerPlaceId,
        provider,
      });

      return NextResponse.json(
        { error: "Place details are temporarily unavailable." },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Place detail proxy failed unexpectedly.", {
      component: "GeoPlacesDetailRoute",
      operation: "GET",
      providerPlaceId,
      provider,
      error,
    });

    return NextResponse.json(
      { error: "Place details could not be loaded." },
      { status: 500 },
    );
  }
}
