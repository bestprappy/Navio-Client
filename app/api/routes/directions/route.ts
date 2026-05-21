import { NextResponse } from "next/server";

import {
  isRouteLineString,
  isDirectionsRequest,
} from "@/app/feature/planner/planId/_components/routes/trip-route.helpers";
import type {
  DirectionsResponse,
  RouteLineString,
  RoutePoint,
  RoutePointGroup,
  RouteProfile,
  RouteSegment,
} from "@/app/feature/planner/planId/_components/routes/trip-route.types";

type MapboxProfile =
  | "mapbox/driving-traffic"
  | "mapbox/driving"
  | "mapbox/walking"
  | "mapbox/cycling";

type MapboxRoute = {
  distance?: unknown;
  duration?: unknown;
  geometry?: unknown;
};

type MapboxDirectionsResponse = {
  code?: unknown;
  message?: unknown;
  routes?: unknown;
};

type ValidatedDirectionsRequest = {
  profile: RouteProfile;
  groups: RoutePointGroup[];
};

const MAPBOX_PROFILES: Record<RouteProfile, MapboxProfile> = {
  "driving-traffic": "mapbox/driving-traffic",
  driving: "mapbox/driving",
  walking: "mapbox/walking",
  cycling: "mapbox/cycling",
};

const VALID_PROFILES: RouteProfile[] = [
  "driving-traffic",
  "driving",
  "walking",
  "cycling",
];

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    const validation = validateDirectionsRequest(payload);

    if (!validation.ok) {
      return NextResponse.json<DirectionsResponse & { error: string }>(
        {
          segments: [],
          error: validation.error,
        },
        { status: 400 },
      );
    }

    const accessToken =
      process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const segments = await getRouteSegments(validation.request, accessToken);

    return NextResponse.json<DirectionsResponse>({ segments });
  } catch (error) {
    console.error("Directions route failed unexpectedly.", {
      component: "DirectionsApiRoute",
      operation: "POST",
      error,
    });

    return NextResponse.json<DirectionsResponse & { error: string }>(
      {
        segments: [],
        error: "Routes could not be calculated.",
      },
      { status: 500 },
    );
  }
}

async function getRouteSegments(
  request: ValidatedDirectionsRequest,
  accessToken?: string,
): Promise<RouteSegment[]> {
  const segments: RouteSegment[] = [];

  for (const group of request.groups) {
    for (let index = 0; index < group.points.length - 1; index += 1) {
      const from = group.points[index];
      const to = group.points[index + 1];

      if (!from || !to) {
        continue;
      }

      if (!accessToken) {
        segments.push(
          createFallbackSegment({
            blockId: group.blockId,
            from,
            to,
            reason: "Mapbox access token missing",
          }),
        );
        continue;
      }

      segments.push(
        await getRouteSegment({
          blockId: group.blockId,
          from,
          to,
          profile: request.profile,
          accessToken,
        }),
      );
    }
  }

  return segments;
}

async function getRouteSegment({
  blockId,
  from,
  to,
  profile,
  accessToken,
}: {
  blockId: string;
  from: RoutePoint;
  to: RoutePoint;
  profile: RouteProfile;
  accessToken: string;
}): Promise<RouteSegment> {
  const profilesToTry: MapboxProfile[] =
    profile === "driving-traffic"
      ? ["mapbox/driving-traffic", "mapbox/driving"]
      : [MAPBOX_PROFILES[profile]];
  const failureReasons: string[] = [];

  for (const mapboxProfile of profilesToTry) {
    try {
      const route = await fetchMapboxRoute({
        accessToken,
        from,
        to,
        profile: mapboxProfile,
      });

      return {
        id: createSegmentId(blockId, from.id, to.id),
        blockId,
        fromItemId: from.id,
        toItemId: to.id,
        fromName: from.name,
        toName: to.name,
        status: "routed",
        geometry: route.geometry,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Route failed";
      failureReasons.push(`${mapboxProfile}: ${reason}`);

      console.error("Mapbox route segment failed.", {
        component: "DirectionsApiRoute",
        operation: "fetchMapboxRoute",
        profile: mapboxProfile,
        fromItemId: from.id,
        toItemId: to.id,
        error,
      });
    }
  }

  return createFallbackSegment({
    blockId,
    from,
    to,
    reason: failureReasons[0] ?? "Road route unavailable",
  });
}

async function fetchMapboxRoute({
  accessToken,
  from,
  to,
  profile,
}: {
  accessToken: string;
  from: RoutePoint;
  to: RoutePoint;
  profile: MapboxProfile;
}): Promise<{
  geometry: RouteLineString;
  distanceMeters: number;
  durationSeconds: number;
}> {
  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = new URL(
    `https://api.mapbox.com/directions/v5/${profile}/${coordinates}`,
  );

  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  const mapboxResponse = parseMapboxResponse(payload);

  if (!response.ok) {
    throw new Error(getMapboxErrorMessage(mapboxResponse, response.status));
  }

  if (mapboxResponse.code !== "Ok") {
    throw new Error(getMapboxErrorMessage(mapboxResponse, response.status));
  }

  const route = getFirstMapboxRoute(mapboxResponse);

  if (!route || !isRouteLineString(route.geometry)) {
    throw new Error("Road route geometry unavailable");
  }

  if (
    typeof route.distance !== "number" ||
    typeof route.duration !== "number"
  ) {
    throw new Error("Road route metrics unavailable");
  }

  return {
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

function validateDirectionsRequest(
  payload: unknown,
):
  | { ok: true; request: ValidatedDirectionsRequest }
  | { ok: false; error: string } {
  if (!isDirectionsRequest(payload)) {
    return { ok: false, error: "Request body must include route groups." };
  }

  const profile = getValidProfile(payload.profile);

  if (!profile) {
    return { ok: false, error: "Route profile is not supported." };
  }

  const groups: RoutePointGroup[] = [];

  for (const group of payload.groups) {
    const parsedGroup = validateRouteGroup(group);

    if (!parsedGroup.ok) {
      return { ok: false, error: parsedGroup.error };
    }

    if (parsedGroup.group.points.length >= 2) {
      groups.push(parsedGroup.group);
    }
  }

  return {
    ok: true,
    request: {
      profile,
      groups,
    },
  };
}

function validateRouteGroup(
  value: unknown,
): { ok: true; group: RoutePointGroup } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: "Route group is invalid." };
  }

  if (typeof value.blockId !== "string" || !value.blockId.trim()) {
    return { ok: false, error: "Route group block ID is invalid." };
  }

  if (!Array.isArray(value.points)) {
    return { ok: false, error: "Route group points are invalid." };
  }

  const points: RoutePoint[] = [];

  for (const point of value.points) {
    const parsedPoint = validateRoutePoint(point);

    if (!parsedPoint.ok) {
      return { ok: false, error: parsedPoint.error };
    }

    points.push(parsedPoint.point);
  }

  return {
    ok: true,
    group: {
      blockId: value.blockId,
      points,
    },
  };
}

function validateRoutePoint(
  value: unknown,
): { ok: true; point: RoutePoint } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: "Route point is invalid." };
  }

  if (typeof value.id !== "string" || !value.id.trim()) {
    return { ok: false, error: "Route point ID is invalid." };
  }

  if (typeof value.name !== "string" || !value.name.trim()) {
    return { ok: false, error: "Route point name is invalid." };
  }

  if (value.type !== "place" && value.type !== "charger") {
    return { ok: false, error: "Route point type is invalid." };
  }

  if (!isValidLatitude(value.lat) || !isValidLongitude(value.lng)) {
    return { ok: false, error: "Route point coordinates are invalid." };
  }

  return {
    ok: true,
    point: {
      id: value.id,
      name: value.name,
      type: value.type,
      lat: value.lat,
      lng: value.lng,
    },
  };
}

function getValidProfile(profile: unknown): RouteProfile | null {
  if (typeof profile === "undefined") {
    return "driving-traffic";
  }

  if (
    typeof profile === "string" &&
    VALID_PROFILES.includes(profile as RouteProfile)
  ) {
    return profile as RouteProfile;
  }

  return null;
}

function createFallbackSegment({
  blockId,
  from,
  to,
  reason,
}: {
  blockId: string;
  from: RoutePoint;
  to: RoutePoint;
  reason: string;
}): RouteSegment {
  return {
    id: createSegmentId(blockId, from.id, to.id),
    blockId,
    fromItemId: from.id,
    toItemId: to.id,
    fromName: from.name,
    toName: to.name,
    status: "fallback",
    geometry: {
      type: "LineString",
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    },
    distanceMeters: Math.round(getDirectDistanceMeters(from, to)),
    fallbackReason: reason,
  };
}

function getDirectDistanceMeters(from: RoutePoint, to: RoutePoint): number {
  const earthRadiusMeters = 6_371_000;
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return (
    earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function createSegmentId(
  blockId: string,
  fromItemId: string,
  toItemId: string,
): string {
  return `segment-${blockId}-${fromItemId}-${toItemId}`;
}

function parseMapboxResponse(value: unknown): MapboxDirectionsResponse {
  if (!isRecord(value)) {
    return {};
  }

  return {
    code: value.code,
    message: value.message,
    routes: value.routes,
  };
}

function getFirstMapboxRoute(
  response: MapboxDirectionsResponse,
): MapboxRoute | null {
  if (!Array.isArray(response.routes)) {
    return null;
  }

  const firstRoute = response.routes[0];

  if (!isRecord(firstRoute)) {
    return null;
  }

  return {
    distance: firstRoute.distance,
    duration: firstRoute.duration,
    geometry: firstRoute.geometry,
  };
}

function getMapboxErrorMessage(
  response: MapboxDirectionsResponse,
  status: number,
): string {
  if (typeof response.message === "string" && response.message.trim()) {
    return response.message;
  }

  if (typeof response.code === "string" && response.code.trim()) {
    return response.code;
  }

  return `Mapbox returned status ${status}`;
}

function isValidLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
