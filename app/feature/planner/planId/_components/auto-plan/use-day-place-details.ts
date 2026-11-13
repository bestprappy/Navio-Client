"use client";

import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { isEvChargerPlaceItem, isPlaceItem, type PlaceSearchResult, type TripBlockItem } from "../constants/types";
import { fetchPlaceDetail } from "../place/place-api";
import { getPlaceReference, placeDetailsQueryKey, reuseCachedDetailsWithPhoto } from "../place/use-place-details";

const DETAIL_TIMEOUT_MS = 15_000;

export type DayPlaceDetails = {
  /** Live details by item id; missing when the lookup failed or the place has no provider id. */
  details: ReadonlyMap<string, PlaceSearchResult | undefined>;
  isLoading: boolean;
  failedCount: number;
};

/**
 * Opening hours and types for the day's places. Planning shows no photos, so it never pays for one.
 * A failed lookup is not an error for the plan: that place just has unknown hours.
 */
export function useDayPlaceDetails(items: readonly TripBlockItem[]): DayPlaceDetails {
  const places = useMemo(() => items.filter(isPlaceItem).filter((item) => !isEvChargerPlaceItem(item)), [items]);
  const queryClient = useQueryClient();
  const results = useQueries({
    queries: places.map((place) => {
      const reference = getPlaceReference(place.placeId);
      return {
        queryKey: placeDetailsQueryKey(reference, false),
        queryFn: ({ signal }: { signal: AbortSignal }) => fetchPlaceDetail(reference!.providerPlaceId, reference!.provider, {
          includePhoto: false,
          signal: AbortSignal.any([signal, AbortSignal.timeout(DETAIL_TIMEOUT_MS)]),
        }),
        ...reuseCachedDetailsWithPhoto(queryClient, reference),
        enabled: reference !== null,
        staleTime: 5 * 60_000,
        retry: 1,
        retryOnMount: false,
      };
    }),
  });

  const version = results.map((result) => `${result.status}:${result.dataUpdatedAt}`).join("|");
  const isLoading = results.some((result) => result.isPending && result.fetchStatus !== "idle");
  const failedCount = results.filter((result) => result.isError).length;
  // Rebuilt only when a lookup settles, so typing in the settings does not rebuild it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const details = useMemo(() => new Map(places.map((place, index) => [place.id, results[index]?.data])), [places, version]);
  return { details, isLoading, failedCount };
}
