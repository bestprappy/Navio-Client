import type { PlaceProvider } from "./data";

export type DestinationSuggestion = {
  provider: PlaceProvider;
  providerPlaceId: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  sessionToken?: string;
  coordinates?: { lat: number; lng: number };
};

type RawSuggestionItem = {
  provider: PlaceProvider;
  providerPlaceId: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  sessionToken?: string;
  place?: { lat: number; lng: number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractCoordinates(
  place: unknown,
): { lat: number; lng: number } | undefined {
  if (!isRecord(place)) return undefined;

  // Mapbox embeds place.location.lat / place.location.lng
  if (isRecord(place.location)) {
    const lat =
      typeof place.location.lat === "number" ? place.location.lat : null;
    const lng =
      typeof place.location.lng === "number" ? place.location.lng : null;
    if (lat !== null && lng !== null) return { lat, lng };
  }

  // Direct lat/lng fields
  const lat = typeof place.lat === "number" ? place.lat : null;
  const lng = typeof place.lng === "number" ? place.lng : null;
  if (lat !== null && lng !== null) return { lat, lng };

  return undefined;
}

export async function fetchDestinationSuggestions(
  query: string,
  sessionToken?: string,
): Promise<DestinationSuggestion[]> {
  const params = new URLSearchParams({ query });

  if (sessionToken) {
    params.set("sessionToken", sessionToken);
  }

  const response = await fetch(`/api/geo/places/destinations?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Destination search failed with status ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!isRecord(data) || !Array.isArray(data.items)) {
    throw new Error("Destination search response shape is invalid.");
  }

  return (data.items as RawSuggestionItem[]).map((item) => ({
    provider: item.provider,
    providerPlaceId: item.providerPlaceId,
    mainText: item.mainText,
    secondaryText: item.secondaryText,
    types: item.types ?? [],
    sessionToken: item.sessionToken,
    coordinates: extractCoordinates(item.place),
  }));
}

export async function fetchDestinationCoordinates(
  providerPlaceId: string,
  provider: PlaceProvider,
  sessionToken?: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ provider });

    if (sessionToken) {
      params.set("sessionToken", sessionToken);
    }

    const encodedId = encodeURIComponent(providerPlaceId);
    const response = await fetch(`/api/geo/places/${encodedId}?${params}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();

    if (!isRecord(data) || !isRecord(data.location)) {
      return null;
    }

    const lat =
      typeof data.location.lat === "number" ? data.location.lat : null;
    const lng =
      typeof data.location.lng === "number" ? data.location.lng : null;

    if (lat === null || lng === null) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}
