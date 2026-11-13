import type { PlacePopularityResponse } from "@/lib/place-popularity-api";

import type { PlaceSearchResult, TripDestination } from "../constants/types";
import { findDestinationGuide, getGuidePicks, type DestinationGuide, type GuideSection } from "../guide/destination-guide";

export type PlaceRecommendation = {
  place: PlaceSearchResult;
  section: Pick<GuideSection, "id" | "colorId" | "iconId">;
  travelerCount?: number;
};

export function canonicalPlaceId(id: string): string {
  return /^ChI[\w-]+$/.test(id) ? `GOOGLE:${id}` : id;
}

function nearby(place: Pick<PlaceSearchResult, "lat" | "lng">, destination: Pick<TripDestination, "lat" | "lng">) {
  if (![place.lat, place.lng, destination.lat, destination.lng].every(Number.isFinite)) return false;
  const radians = Math.PI / 180;
  const a = Math.sin((place.lat - destination.lat) * radians / 2) ** 2
    + Math.cos(place.lat * radians) * Math.cos(destination.lat * radians)
    * Math.sin((place.lng - destination.lng) * radians / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, a))) <= 50;
}

/** Merge real traveler evidence with curation without manufacturing popularity for guide picks. */
export function buildPlaceRecommendations(
  destination: TripDestination,
  guides: readonly DestinationGuide[],
  popularity?: PlacePopularityResponse,
  limit = 6,
): PlaceRecommendation[] {
  const guide = findDestinationGuide(destination, guides);
  const curated = new Map<string, PlaceRecommendation>();
  for (const pick of guide ? getGuidePicks(guide, 60) : []) {
    if (!nearby(pick.place, destination)) continue;
    const id = canonicalPlaceId(pick.place.id);
    if (!curated.has(id)) curated.set(id, { place: { ...pick.place, id }, section: pick.section });
  }
  const selected = new Map<string, PlaceRecommendation>();
  const ranked = [...(popularity?.items ?? [])].sort((a, b) => b.travelerCount - a.travelerCount || a.placeId.localeCompare(b.placeId));
  for (const item of ranked) {
    if (item.travelerCount < (popularity?.minimumTravelers ?? 5)) continue;
    const known = curated.get(item.placeId);
    if (known) selected.set(item.placeId, { ...known, travelerCount: item.travelerCount });
    else if (item.place && nearby(item.place, destination)) {
      const provider = item.placeId.startsWith("MAPBOX:") ? "MAPBOX" : "GOOGLE";
      selected.set(item.placeId, {
        place: { ...item.place, id: item.placeId, provider, providerPlaceId: item.placeId.slice(provider.length + 1),
          primaryType: item.place.primaryType ?? undefined, imageUrl: undefined },
        section: { id: "visit", colorId: "blue" }, travelerCount: item.travelerCount,
      });
    }
  }
  for (const [id, item] of curated) if (!selected.has(id)) selected.set(id, item);
  return [...selected.values()].slice(0, Math.max(0, limit));
}
