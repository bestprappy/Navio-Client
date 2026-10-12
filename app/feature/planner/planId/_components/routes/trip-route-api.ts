import { isRouteSegmentsResponse } from "./trip-route.helpers";
import type { DirectionsRequest, DirectionsResponse, RoutePointGroup } from "./trip-route.types";

// Match the mobility DirectionsRequest / RoutePointGroupRequest validation limits.
const MAX_GROUPS = 10;
const MAX_POINTS = 25;

function splitGroups(groups: RoutePointGroup[]): RoutePointGroup[] {
  return groups.flatMap(group => {
    const chunks: RoutePointGroup[] = [];
    // Reuse the boundary point so every adjacent leg is requested exactly once.
    for (let start = 0; start < group.points.length - 1; start += MAX_POINTS - 1) {
      chunks.push({ ...group, points: group.points.slice(start, start + MAX_POINTS) });
    }
    return chunks;
  });
}

export async function fetchTripRoutes(
  requestBody: DirectionsRequest,
  signal?: AbortSignal,
): Promise<DirectionsResponse> {
  const groups = splitGroups(requestBody.groups);
  const segments: DirectionsResponse["segments"] = [];
  // Sequential batches bound upstream load; publish only a complete trip result.
  for (let start = 0; start < groups.length; start += MAX_GROUPS) {
    signal?.throwIfAborted();
    const batch = groups.slice(start, start + MAX_GROUPS);
    const response = await fetch("/api/routes/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...requestBody, groups: batch }),
      signal,
    });
    if (!response.ok) {
      const message = await getErrorMessage(response);
      // Include the status/message in text because the dev overlay can hide object fields.
      console.warn(`Trip routes failed to load (HTTP ${response.status}): ${message}`);
      throw new Error(message);
    }
    const payload: unknown = await response.json().catch(() => null);
    if (!isRouteSegmentsResponse(payload)) {
      throw new Error("Routes could not be loaded: the service returned an invalid response.");
    }
    const expectedLegs = batch.flatMap(group => group.points.slice(1).map((point, index) => ({
      blockId: group.blockId, fromItemId: group.points[index].id, toItemId: point.id,
    })));
    if (payload.segments.length !== expectedLegs.length || payload.segments.some((segment, index) => {
      const expected = expectedLegs[index];
      return segment.blockId !== expected.blockId || segment.fromItemId !== expected.fromItemId
        || segment.toItemId !== expected.toItemId;
    })) {
      throw new Error("Routes could not be loaded: the service returned incomplete or mismatched route legs.");
    }
    segments.push(...payload.segments);
  }
  signal?.throwIfAborted();
  return { segments };
}

async function getErrorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (typeof payload === "object" && payload !== null) {
    const fields = payload as Record<string, unknown>;
    const messages: string[] = [];
    for (const key of ["message", "error"] as const) {
      const value = fields[key];
      if (typeof value === "string" && value.trim()) {
        messages.push(value.trim());
      }
    }
    if ("validationErrors" in payload && typeof payload.validationErrors === "object"
      && payload.validationErrors !== null) {
      for (const [field, detail] of Object.entries(payload.validationErrors)) {
        if (typeof detail === "string" && detail.trim()) messages.push(`${field}: ${detail}`);
      }
    }
    if (messages.length) return [...new Set(messages)].join("; ");
  }
  return `Routes could not be loaded (HTTP ${response.status}).`;
}
