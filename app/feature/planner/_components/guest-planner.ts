import { atom } from "jotai";
import { isPersistedTripId, type CreateTripPayload, type TripResponse } from "./planner-api";

export const guestTripAtom = atom<TripResponse | null>(null);

export function isGuestPlanner(planId: string | undefined, authenticated: boolean): boolean {
  return !!planId && (planId.startsWith("guest-") || (!authenticated && !isPersistedTripId(planId)));
}

export type GuestTripPayload = CreateTripPayload & {
  destinationName: string;
  destinationLat?: number;
  destinationLng?: number;
};

export function createGuestTrip(payload: GuestTripPayload, id = `guest-${crypto.randomUUID()}`): TripResponse {
  const now = new Date().toISOString();
  return {
    ...payload, id, destinationLat: payload.destinationLat ?? null,
    destinationLng: payload.destinationLng ?? null,
    displayName: payload.displayName ?? null,
    title: payload.displayName ?? payload.destinationName,
    destinationCountry: null, destinationCity: null,
    destinationRegion: null, destinationCountryCode: null,
    visibility: "PRIVATE", createdAt: now, updatedAt: now,
  };
}
