"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { fetchPlaceDetail } from "./place-api";
import type { PlaceProvider, PlaceSearchResult } from "../constants/types";

export function getPlaceReference(placeId: string) {
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

/** Lookups with and without a photo answer differently, so they are cached apart. */
export function placeDetailsQueryKey(
  reference: ReturnType<typeof getPlaceReference>,
  includePhoto: boolean,
) {
  const key = ["place-details", reference?.provider, reference?.providerPlaceId];
  return includePhoto ? key : [...key, "without-photo"];
}

/**
 * Lets a lookup without a photo start from one already cached with a photo, so it makes no new
 * Google call. Never the reverse: a result without a photo cannot serve a card that needs one.
 */
export function reuseCachedDetailsWithPhoto(
  queryClient: QueryClient,
  reference: ReturnType<typeof getPlaceReference>,
) {
  const key = placeDetailsQueryKey(reference, true);
  return {
    initialData: () => queryClient.getQueryData<PlaceSearchResult>(key),
    initialDataUpdatedAt: () => queryClient.getQueryState(key)?.dataUpdatedAt,
  };
}

/**
 * @param includePhoto pass `false` when the caller already holds a photo or never shows one:
 * a photo is a separately billed Google request.
 */
export function usePlaceDetails(placeId: string, { includePhoto = true, enabled = true }: { includePhoto?: boolean; enabled?: boolean } = {}) {
  const reference = getPlaceReference(placeId);
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: placeDetailsQueryKey(reference, includePhoto),
    queryFn: ({ signal }) => fetchPlaceDetail(reference!.providerPlaceId, reference!.provider, { includePhoto, signal }),
    ...(includePhoto ? {} : reuseCachedDetailsWithPhoto(queryClient, reference)),
    enabled: reference !== null && enabled,
    staleTime: 5 * 60_000,
    retry: 1,
    retryOnMount: false,
  });
}
