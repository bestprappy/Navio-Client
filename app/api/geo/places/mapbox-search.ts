type JsonRecord = Record<string, unknown>;

export type MapboxSuggestionItem = {
  provider: "MAPBOX";
  providerPlaceId: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  sessionToken: string;
  place: MapboxPlaceDetailResponse;
};

export type MapboxAutocompleteResponse = {
  items: MapboxSuggestionItem[];
};

export type MapboxPlaceDetailResponse = {
  provider: "MAPBOX";
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
};

const MAPBOX_SEARCH_BASE_URL = "https://api.mapbox.com/search/searchbox/v1";

export function getMapboxSearchToken() {
  return process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

export function createMapboxSessionToken(sessionToken: string | null) {
  return sessionToken?.trim() || crypto.randomUUID();
}

export async function fetchMapboxAutocomplete({
  query,
  lat,
  lng,
  sessionToken,
  accessToken,
  types,
}: {
  query: string;
  lat: string | null;
  lng: string | null;
  sessionToken: string;
  accessToken: string;
  types?: string;
}): Promise<MapboxAutocompleteResponse> {
  const url = new URL(`${MAPBOX_SEARCH_BASE_URL}/forward`);
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("limit", "10");
  url.searchParams.set("language", "en");

  if (types) {
    url.searchParams.set("types", types);
  }

  if (isCoordinatePair(lat, lng)) {
    url.searchParams.set("proximity", `${lng},${lat}`);
  }

  const response = await fetch(url, { cache: "no-store" });
  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getMapboxErrorMessage(data, response.status));
  }

  if (!isRecord(data) || !Array.isArray(data.features)) {
    throw new Error("Mapbox autocomplete response shape is invalid.");
  }

  return {
    items: sortSuggestionsByDistance(
      data.features.flatMap((feature) =>
        mapFeatureToSuggestion(feature, sessionToken),
      ),
      lat,
      lng,
    ).slice(0, 8),
  };
}

export async function fetchMapboxPlaceDetail({
  providerPlaceId,
  sessionToken,
  accessToken,
}: {
  providerPlaceId: string;
  sessionToken: string;
  accessToken: string;
}): Promise<MapboxPlaceDetailResponse> {
  const url = new URL(
    `${MAPBOX_SEARCH_BASE_URL}/retrieve/${encodeURIComponent(providerPlaceId)}`,
  );
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("language", "en");

  const response = await fetch(url, { cache: "no-store" });
  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getMapboxErrorMessage(data, response.status));
  }

  if (!isRecord(data) || !Array.isArray(data.features)) {
    throw new Error("Mapbox place detail response shape is invalid.");
  }

  const feature = data.features.find(isRecord);

  if (!feature) {
    throw new Error("Mapbox did not return a place detail feature.");
  }

  return mapFeatureToDetail(feature, providerPlaceId);
}

function mapFeatureToSuggestion(
  value: unknown,
  sessionToken: string,
): MapboxSuggestionItem[] {
  if (!isRecord(value)) {
    return [];
  }

  const properties = isRecord(value.properties) ? value.properties : {};
  const providerPlaceId = getString(properties.mapbox_id) ?? getString(value.id);

  if (!providerPlaceId) {
    return [];
  }

  let place: MapboxPlaceDetailResponse;

  try {
    place = mapFeatureToDetail(value, providerPlaceId);
  } catch {
    return [];
  }

  const mainText =
    getString(properties.name_preferred) ??
    getString(properties.name) ??
    place.name;
  const secondaryText =
    getString(properties.full_address) ??
    getString(properties.place_formatted) ??
    getString(properties.address) ??
    place.address;
  const types = getFeatureTypes(properties);

  return [
    {
      provider: "MAPBOX",
      providerPlaceId,
      mainText,
      secondaryText: secondaryText ?? "",
      types,
      sessionToken,
      place,
    },
  ];
}

function mapFeatureToDetail(
  feature: JsonRecord,
  requestedProviderPlaceId: string,
): MapboxPlaceDetailResponse {
  const properties = isRecord(feature.properties) ? feature.properties : {};
  const coordinates = getFeatureCoordinates(feature, properties);

  if (!coordinates) {
    throw new Error("Mapbox place detail is missing coordinates.");
  }

  const providerPlaceId =
    getString(properties.mapbox_id) ??
    getString(feature.id) ??
    requestedProviderPlaceId;
  const name =
    getString(properties.name_preferred) ??
    getString(properties.name) ??
    getString(properties.full_address) ??
    "Selected place";
  const address =
    getString(properties.full_address) ??
    formatAddressParts(properties) ??
    getString(properties.place_formatted) ??
    formatContext(properties.context);
  const category = getCategory(properties);
  const website = getString(properties.website) ?? getString(properties.url);
  const phone =
    getString(properties.phone) ??
    getString(properties.phone_number) ??
    getString(properties.tel);

  return {
    provider: "MAPBOX",
    providerPlaceId,
    name,
    address: address ?? null,
    location: {
      lat: coordinates.lat,
      lng: coordinates.lng,
      address: address ?? null,
      placeId: providerPlaceId,
    },
    phone: phone ?? null,
    website: website ?? null,
    photoUrl: null,
    openingHours: {},
    category,
    description: getFeatureDescription(properties),
  };
}

function getFeatureCoordinates(
  feature: JsonRecord,
  properties: JsonRecord,
): { lat: number; lng: number } | null {
  const propertyCoordinates = isRecord(properties.coordinates)
    ? properties.coordinates
    : null;
  const propertyLat = getNumber(propertyCoordinates?.latitude);
  const propertyLng = getNumber(propertyCoordinates?.longitude);

  if (propertyLat !== null && propertyLng !== null) {
    return { lat: propertyLat, lng: propertyLng };
  }

  const geometry = isRecord(feature.geometry) ? feature.geometry : null;
  const geometryCoordinates = Array.isArray(geometry?.coordinates)
    ? geometry.coordinates
    : null;
  const lng = getNumber(geometryCoordinates?.[0]);
  const lat = getNumber(geometryCoordinates?.[1]);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

function formatAddressParts(properties: JsonRecord) {
  const address = getString(properties.address);
  const placeFormatted = getString(properties.place_formatted);

  return [address, placeFormatted].filter(isNonEmptyString).join(", ") || null;
}

function formatContext(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const labels = [
    "neighborhood",
    "locality",
    "place",
    "city",
    "district",
    "region",
    "postcode",
    "country",
  ]
    .map((key) => {
      const contextValue = value[key];

      if (isRecord(contextValue)) {
        return getString(contextValue.name);
      }

      return getString(contextValue);
    })
    .filter(isNonEmptyString);

  return labels.join(", ") || null;
}

function getCategory(properties: JsonRecord) {
  const category = getStringArray(properties.poi_category)[0];

  if (!category) {
    return undefined;
  }

  return category
    .split(/[ _-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFeatureDescription(properties: JsonRecord) {
  const featureType = getString(properties.feature_type);

  if (!featureType) {
    return undefined;
  }

  return getCategory(properties) ?? featureType.replaceAll("_", " ");
}

function getFeatureTypes(properties: JsonRecord) {
  const featureType = getString(properties.feature_type);
  const poiCategories = getStringArray(properties.poi_category);

  return [featureType, ...poiCategories].filter(isNonEmptyString);
}

function getMapboxErrorMessage(data: unknown, status: number) {
  if (isRecord(data)) {
    const message = getString(data.message);

    if (message) {
      return message;
    }
  }

  return `Mapbox place search failed with status ${status}.`;
}

function sortSuggestionsByDistance(
  suggestions: MapboxSuggestionItem[],
  lat: string | null,
  lng: string | null,
) {
  if (!isCoordinatePair(lat, lng)) {
    return suggestions;
  }

  const originLat = Number(lat);
  const originLng = Number(lng);

  return [...suggestions].sort((a, b) => {
    const aDistance = getDistanceKm(originLat, originLng, a.place.location.lat, a.place.location.lng);
    const bDistance = getDistanceKm(originLat, originLng, b.place.location.lat, b.place.location.lng);

    return aDistance - bDistance;
  });
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

function isCoordinatePair(lat: string | null, lng: string | null) {
  return (
    lat !== null &&
    lng !== null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => isNonEmptyString(item))
    : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
