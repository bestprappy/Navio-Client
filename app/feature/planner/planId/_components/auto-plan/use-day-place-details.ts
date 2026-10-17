"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { isEvChargerPlaceItem, isPlaceItem, type PlaceSearchResult, type TripBlockItem } from "../constants/types";
import { fetchPlaceDetail } from "../place/place-api";
import { getPlaceReference } from "../place/use-place-details";

const DETAIL_TIMEOUT_MS = 15_000;

export type DayPlaceDetails = {
  /** Live details by item id; missing when the lookup failed or the place has no provider id. */
  details: ReadonlyMap<string, PlaceSearchResult | undefined>;
  isLoading: boolean;
  failedCount: number;
};

/**
 * Opening hours and types for the day's places, from the same cache the place cards use.
 * A failed lookup is not an error for the plan: that place just has unknown hours.
 */
export function useDayPlaceDetails(items: readonly TripBlockItem[]): DayPlaceDetails {
  const places = useMemo(() => items.filter(isPlaceItem).filter((item) => !isEvChargerPlaceItem(item)), [items]);
  const results = useQueries({
    queries: places.map((place) => {
      const reference = getPlaceReference(place.placeId);
      return {
        queryKey: ["place-details", reference?.provider, reference?.providerPlaceId],
        queryFn: ({ signal }: { signal: AbortSignal }) => fetchPlaceDetail(reference!.providerPlaceId, reference!.provider, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(DETAIL_TIMEOUT_MS)]),
        }),
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
