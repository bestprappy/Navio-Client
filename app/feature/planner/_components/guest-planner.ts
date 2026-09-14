import { atom } from "jotai";
import { isPersistedTripId, type CreateTripPayload, type TripResponse } from "./planner-api";

export const guestTripAtom = atom<TripResponse | null>(null);

export function isGuestPlanner(planId: string | undefined, authenticated: boolean): boolean {
  return !!planId && (planId.startsWith("guest-") || (!authenticated && !isPersistedTripId(planId)));
}

export function createGuestTrip(payload: CreateTripPayload, id = `guest-${crypto.randomUUID()}`): TripResponse {
  const now = new Date().toISOString();
  return {
    ...payload, id, destinationLat: payload.destinationLat ?? null,
    destinationLng: payload.destinationLng ?? null,
    destinationCountry: payload.destinationCountry ?? null,
    visibility: "PRIVATE", createdAt: now, updatedAt: now,
  };
}
