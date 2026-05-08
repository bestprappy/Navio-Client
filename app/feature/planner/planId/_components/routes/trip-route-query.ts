"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import {
  getTripRouteGroups,
  getTripRouteSignature,
  isRouteSegmentsResponse,
} from "./trip-route.helpers";
import type {
  DirectionsRequest,
  DirectionsResponse,
  RouteProfile,
} from "./trip-route.types";

const DEFAULT_ROUTE_PROFILE: RouteProfile = "driving-traffic";

export function useTripRoutes(profile: RouteProfile = DEFAULT_ROUTE_PROFILE) {
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const groups = useMemo(() => getTripRouteGroups(tripBlocks), [tripBlocks]);
  const signature = useMemo(() => getTripRouteSignature(groups), [groups]);
  const hasRouteSegments = groups.length > 0;

  return useQuery({
    queryKey: ["trip-routes", profile, signature],
    queryFn: () =>
      fetchTripRoutes({
        profile,
        groups,
      }),
    enabled: hasRouteSegments,
    staleTime: 5 * 60_000,
  });
}

async function fetchTripRoutes(
  requestBody: DirectionsRequest,
): Promise<DirectionsResponse> {
  const response = await fetch("/api/routes/directions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);

    console.error("Trip routes failed to load.", {
      component: "TripRoutes",
      operation: "fetchTripRoutes",
      status: response.status,
      message,
    });

    throw new Error(message);
  }

  const payload: unknown = await response.json();

  if (!isRouteSegmentsResponse(payload)) {
    console.error("Trip routes response was malformed.", {
      component: "TripRoutes",
      operation: "validateTripRoutesResponse",
      payload,
    });

    throw new Error("Routes could not be loaded.");
  }

  return payload;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();

    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  } catch (error) {
    console.error("Route error response could not be parsed.", {
      component: "TripRoutes",
      operation: "parseRouteError",
      error,
    });
  }

  return "Routes could not be loaded.";
}
