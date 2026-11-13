import { z } from "zod";

import { apiRequest } from "@/lib/api-client";

export const popularityPreferenceSchema = z.object({ contributes: z.boolean() });
export const placeRecommendationsSchema = z.object({
  minimumTravelers: z.number().int().min(5),
  items: z.array(z.object({
    placeId: z.string().regex(/^(GOOGLE|MAPBOX):\S+$/),
    travelerCount: z.number().int().min(5),
    place: z.object({
      name: z.string().trim().min(1).max(1000),
      address: z.string().max(4000),
      lat: z.number().finite().min(-90).max(90),
      lng: z.number().finite().min(-180).max(180),
      primaryType: z.string().nullable(),
      imageUrl: z.string().nullable(),
    }).nullable(),
  })).max(48),
});

export type PlacePopularityResponse = z.infer<typeof placeRecommendationsSchema>;
export const placePopularityKeys = {
  recommendations: ["place-popularity", "recommendations"] as const,
  preference: (accountId: string | null) => ["place-popularity", "preference", accountId] as const,
};

export function getPlaceRecommendations(tripId: string, lat: number, lng: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return apiRequest(`/api/trips/${encodeURIComponent(tripId)}/place-recommendations?${query}`, {
    schema: placeRecommendationsSchema, operation: "getPlaceRecommendations", signal,
  });
}

export function getPopularityPreference(signal?: AbortSignal) {
  return apiRequest("/api/trips/place-popularity/preferences", {
    schema: popularityPreferenceSchema, operation: "getPopularityPreference", signal,
  });
}

export function setPopularityPreference(contributes: boolean) {
  return apiRequest("/api/trips/place-popularity/preferences", {
    method: "PUT", body: { contributes }, schema: popularityPreferenceSchema, operation: "setPopularityPreference",
  });
}
