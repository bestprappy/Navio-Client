"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import {
  getTripRouteGroups,
  getTripRouteSignature,
} from "./trip-route.helpers";
import type {
  RoutePointGroup,
  RouteProfile,
} from "./trip-route.types";
import { fetchTripRoutes } from "./trip-route-api";
export { fetchTripRoutes } from "./trip-route-api";

const subscribeToHydration = () => () => {};

export const DEFAULT_ROUTE_PROFILE: RouteProfile = "driving-traffic";

export function useTripRoutes(profile: RouteProfile = DEFAULT_ROUTE_PROFILE) {
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const groups = useMemo(() => getTripRouteGroups(tripBlocks), [tripBlocks]);

  return useTripRoutesForGroups(groups, profile);
}

export function useTripRoutesForGroups(
  groups: RoutePointGroup[],
  profile: RouteProfile = DEFAULT_ROUTE_PROFILE,
) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const signature = useMemo(() => getTripRouteSignature(groups), [groups]);
  const hasRouteSegments = groups.length > 0;

  return useQuery({
    queryKey: ["trip-routes", profile, signature],
    queryFn: ({ signal }) =>
      fetchTripRoutes({
        profile,
        groups,
      }, signal),
    enabled: hasRouteSegments && hydrated,
    staleTime: 5 * 60_000,
  });
}
