"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchTripRoutes } from "./trip-route-api";
import { getTripRouteSignature } from "./trip-route.helpers";
import type { RoutePoint } from "./trip-route.types";
import { mergeTravelOptionResults, getTravelOptionRequests, type TravelOption } from "./travel-options";
import { addWalkFinishAlternatives } from "./transit-walk-alternatives";

export function useTravelOptions(blockId: string, from: RoutePoint, to: RoutePoint, enabled: boolean) {
  const requests = getTravelOptionRequests(blockId, from, to);
  const signature = getTripRouteSignature(requests[0].request.groups);
  return useQuery({
    queryKey: ["leg-travel-options", "journeys-v4", signature],
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async ({ signal }): Promise<TravelOption[]> => {
      const results = await Promise.allSettled(requests.map(({ key, request }) => fetchTripRoutes(
        key === "transit" || key === "rail" || key === "bus" ? { ...request, includeTransitAlternatives: true } : request, signal)));
      signal.throwIfAborted();
      // One unavailable mode must not hide the other usable journeys.
      const merged = mergeTravelOptionResults(results.map((result, index) => ({ key: requests[index].key,
        segment: result.status === "fulfilled" ? result.value.segments[0] ? { ...result.value.segments[0], journeys: result.value.segments[0].journeys?.map(journey => ({ ...journey, id: `${index}:${journey.id}` })) } : null : null })));
      for (const option of merged) {
        if ((option.key !== "rail" && option.key !== "bus") || !option.segment || option.segment.status !== "routed") continue;
        option.segment = await addWalkFinishAlternatives(option.segment, to, async (station, destination) => {
          const response = await fetchTripRoutes({ profile: "walking", groups: [{ blockId, points: [station, { ...destination, arrivalMode: "walk", arrivalRouteKey: undefined, railOnly: undefined }] }] }, signal);
          return response.segments[0] ?? null;
        });
        signal.throwIfAborted();
      }
      return mergeTravelOptionResults(merged);
    },
  });
}
