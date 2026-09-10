import {
  isTripResponse,
  PlannerApiError,
  requestJson,
  type CreateTripPayload,
  type TripResponse,
} from "./planner-api";

export type TripMetadataUpdate = Partial<CreateTripPayload>;

export const tripMetadataQueryKey = (tripId: string) =>
  ["planner-trip", tripId] as const;

export async function getTripMetadata(tripId: string): Promise<TripResponse> {
  const value = await requestJson(`/api/trips/${encodeURIComponent(tripId)}`);
  if (!isTripResponse(value)) {
    throw new PlannerApiError("The trip details could not be loaded.", 502);
  }
  return value;
}

export async function updateTripMetadata(
  tripId: string,
  update: TripMetadataUpdate,
): Promise<TripResponse> {
  const value = await requestJson(`/api/trips/${encodeURIComponent(tripId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!isTripResponse(value)) {
    throw new PlannerApiError("The trip details could not be saved.", 502);
  }
  return value;
}
