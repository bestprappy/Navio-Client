import { mockPlaceSearchResults } from "../constants/place.data";
import type {
  PlaceAutocompleteSuggestion,
  PlaceProvider,
  PlaceSearchResult,
} from "../constants/types";

// Set NEXT_PUBLIC_PLACE_DATA_SOURCE=mock in .env.local to use mock data.
// Defaults to live API when unset.
const isUsingMock =
  process.env.NEXT_PUBLIC_PLACE_DATA_SOURCE === "mock";

type PlaceDetailApiResponse = {
  provider: PlaceProvider;
  providerPlaceId: string;
  name: string;
  address: string | null;
  location: {
    lat: number;
    lng: number;
    address: string | null;
    placeId: string | null;
  };
  phone: string | null;
  website: string | null;
  photoUrl: string | null;
  openingHours: Record<string, unknown>;
  category?: string;
  description?: string;
  rating?: number | null;
  reviewCount?: number | null;
};

type PlaceAutocompleteApiResponse = {
  items: Array<{
    provider: PlaceProvider;
    providerPlaceId: string;
    mainText: string;
    secondaryText: string;
    types: string[];
    sessionToken?: string;
    place?: PlaceDetailApiResponse;
  }>;
};

type PlaceSearchApiResponse = {
  items: PlaceDetailApiResponse[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractOpeningHoursSummary(
  openingHours: Record<string, unknown>,
): string | undefined {
  const summary = openingHours.summary;
  return typeof summary === "string" ? summary : undefined;
}

function placeDetailToSearchResult(
  detail: PlaceDetailApiResponse,
): PlaceSearchResult {
  return {
    id: `${detail.provider}:${detail.providerPlaceId}`,
    provider: detail.provider,
    providerPlaceId: detail.providerPlaceId,
    name: detail.name,
    address: detail.address ?? detail.location.address ?? "",
    lat: detail.location.lat,
    lng: detail.location.lng,
    phone: detail.phone ?? undefined,
    website: detail.website ?? undefined,
    imageUrl: detail.photoUrl ?? undefined,
    openingHours: extractOpeningHoursSummary(detail.openingHours),
    category: detail.category,
    description: detail.description,
    rating: detail.rating ?? undefined,
    reviewCount: detail.reviewCount ?? undefined,
  };
}

// --- Mock implementations ---

function mockAutocomplete(query: string): PlaceAutocompleteSuggestion[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 2) {
    return [];
  }

  const allPlaces = Object.values(mockPlaceSearchResults).flat();

  return allPlaces
    .filter(
      (place) =>
        place.name.toLowerCase().includes(normalized) ||
        place.category?.toLowerCase().includes(normalized),
    )
    .slice(0, 8)
    .map((place) => ({
      provider: "GOOGLE" as PlaceProvider,
      providerPlaceId: place.id,
      mainText: place.name,
      secondaryText: place.address,
      types: place.category ? [place.category.toLowerCase()] : [],
    }));
}

function mockSearch(
  query: string,
  lat?: number,
  lng?: number,
): PlaceSearchResult[] {
  const normalized = normalizeSearchText(query);

  if (normalized.length < 2) {
    return [];
  }

  return Object.values(mockPlaceSearchResults)
    .flat()
    .filter((place) => doesMockPlaceMatchQuery(place, normalized))
    .sort((a, b) => {
      if (lat === undefined || lng === undefined) {
        return 0;
      }

      return (
        getDistanceKm(lat, lng, a.lat, a.lng) -
        getDistanceKm(lat, lng, b.lat, b.lng)
      );
    })
    .slice(0, 10)
    .map((place) => ({
      id: `GOOGLE:${place.id}`,
      provider: "GOOGLE" as PlaceProvider,
      providerPlaceId: place.id,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      website: place.website,
      imageUrl: place.imageUrl,
      openingHours: place.openingHours,
      description: place.description,
      rating: place.rating,
      reviewCount: place.reviewCount,
      category: place.category,
    }));
}

function mockFetchDetail(providerPlaceId: string): PlaceSearchResult | null {
  const place = Object.values(mockPlaceSearchResults)
    .flat()
    .find((p) => p.id === providerPlaceId);

  if (!place) {
    return null;
  }

  return {
    id: `GOOGLE:${place.id}`,
    provider: "GOOGLE",
    providerPlaceId: place.id,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    phone: place.phone,
    website: place.website,
    imageUrl: place.imageUrl,
    openingHours: place.openingHours,
    description: place.description,
    rating: place.rating,
    reviewCount: place.reviewCount,
    category: place.category,
  };
}

// --- Live API implementations ---

async function liveAutocomplete(
  query: string,
  lat?: number,
  lng?: number,
  sessionToken?: string,
): Promise<PlaceAutocompleteSuggestion[]> {
  const params = new URLSearchParams({ query });

  if (lat !== undefined) {
    params.set("lat", String(lat));
  }

  if (lng !== undefined) {
    params.set("lng", String(lng));
  }

  if (sessionToken) {
    params.set("sessionToken", sessionToken);
  }

  const response = await fetch(`/api/geo/places/autocomplete?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Autocomplete request failed with status ${response.status}`,
    );
  }

  const data: unknown = await response.json();

  if (!isRecord(data) || !Array.isArray(data.items)) {
    throw new Error("Autocomplete response shape is invalid.");
  }

  return (data as PlaceAutocompleteApiResponse).items.map((item) => ({
    provider: item.provider,
    providerPlaceId: item.providerPlaceId,
    mainText: item.mainText,
    secondaryText: item.secondaryText,
    types: item.types,
    sessionToken: item.sessionToken,
    place: item.place ? placeDetailToSearchResult(item.place) : undefined,
  }));
}

async function liveFetchDetail(
  providerPlaceId: string,
  provider: PlaceProvider,
  sessionToken?: string,
): Promise<PlaceSearchResult> {
  const params = new URLSearchParams({ provider });

  if (sessionToken) {
    params.set("sessionToken", sessionToken);
  }

  const encodedId = encodeURIComponent(providerPlaceId);
  const response = await fetch(`/api/geo/places/${encodedId}?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Place detail request failed with status ${response.status}`,
    );
  }

  const data: unknown = await response.json();

  if (!isRecord(data)) {
    throw new Error("Place detail response shape is invalid.");
  }

  return placeDetailToSearchResult(data as PlaceDetailApiResponse);
}

async function liveNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusMeters),
  });

  const response = await fetch(`/api/geo/places/nearby?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Nearby places request failed with status ${response.status}`,
    );
  }

  const data: unknown = await response.json();

  if (!isRecord(data) || !Array.isArray(data.items)) {
    throw new Error("Nearby places response shape is invalid.");
  }

  return (data as PlaceSearchApiResponse).items.map(placeDetailToSearchResult);
}

async function liveSearch(
  query: string,
  lat?: number,
  lng?: number,
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({ query });

  if (lat !== undefined) {
    params.set("lat", String(lat));
  }

  if (lng !== undefined) {
    params.set("lng", String(lng));
  }

  const response = await fetch(`/api/geo/places/search?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Place search failed with status ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!isRecord(data) || !Array.isArray(data.items)) {
    throw new Error("Place search response shape is invalid.");
  }

  return (data as PlaceSearchApiResponse).items.map(placeDetailToSearchResult);
}

// --- Public API ---

export async function fetchPlaceAutocomplete(
  query: string,
  options?: { lat?: number; lng?: number; sessionToken?: string },
): Promise<PlaceAutocompleteSuggestion[]> {
  if (isUsingMock) {
    return mockAutocomplete(query);
  }

  return liveAutocomplete(
    query,
    options?.lat,
    options?.lng,
    options?.sessionToken,
  );
}

export async function fetchPlaceDetail(
  providerPlaceId: string,
  provider: PlaceProvider,
  options?: { sessionToken?: string },
): Promise<PlaceSearchResult> {
  if (isUsingMock) {
    const result = mockFetchDetail(providerPlaceId);

    if (!result) {
      throw new Error(`Mock place not found: ${providerPlaceId}`);
    }

    return result;
  }

  return liveFetchDetail(providerPlaceId, provider, options?.sessionToken);
}

export async function fetchPlaceSearch(
  query: string,
  options?: { lat?: number; lng?: number },
): Promise<PlaceSearchResult[]> {
  if (isUsingMock) {
    return mockSearch(query, options?.lat, options?.lng);
  }

  return liveSearch(query, options?.lat, options?.lng);
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters = 800,
): Promise<PlaceSearchResult[]> {
  if (isUsingMock) {
    return mockSearch("", lat, lng);
  }

  return liveNearbyPlaces(lat, lng, radiusMeters);
}

// Re-export types so callers only need to import from one place
export type { PlaceAutocompleteSuggestion, PlaceSearchResult };

function doesMockPlaceMatchQuery(
  place: { name: string; category?: string },
  normalizedQuery: string,
) {
  const searchableText = normalizeSearchText(
    `${place.name} ${place.category ?? ""}`,
  );
  const searchableTokens = searchableText.split(" ").filter(Boolean);
  const compactQuery = normalizedQuery.replaceAll(" ", "");

  return (
    searchableText.includes(normalizedQuery) ||
    searchableText.replaceAll(" ", "").includes(compactQuery) ||
    searchableTokens.some((token) => getEditDistance(compactQuery, token) <= 2)
  );
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getEditDistance(source: string, target: string) {
  const distances = Array.from({ length: source.length + 1 }, (_, index) => [
    index,
  ]);

  for (let column = 1; column <= target.length; column += 1) {
    distances[0][column] = column;
  }

  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;

      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + cost,
      );
    }
  }

  return distances[source.length][target.length];
}
