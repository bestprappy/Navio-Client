"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPlaceDetail } from "./place-api";
import type { PlaceProvider } from "../constants/types";

function getPlaceReference(placeId: string) {
  const match = /^(GOOGLE|MAPBOX):(.+)$/.exec(placeId);
  if (match) {
    return { provider: match[1] as PlaceProvider, providerPlaceId: match[2] };
  }

  // Explore's seeded stops predate the provider prefix.
  if (/^ChI[A-Za-z0-9_-]+$/.test(placeId)) {
    return { provider: "GOOGLE" as const, providerPlaceId: placeId };
  }

  return null;
}

export function usePlaceDetails(placeId: string) {
  const reference = getPlaceReference(placeId);

  return useQuery({
    queryKey: ["place-details", reference?.provider, reference?.providerPlaceId],
    queryFn: () => fetchPlaceDetail(reference!.providerPlaceId, reference!.provider),
    enabled: reference !== null,
    staleTime: 5 * 60_000,
    retry: 1,
    retryOnMount: false,
  });
}
