type JsonRecord = Record<string, unknown>;

type GooglePlaceAutocompleteResponse = {
  items: GooglePlaceSuggestionItem[];
};

type GooglePlaceSearchResponse = {
  items: GooglePlaceDetailResponse[];
};

type GooglePlaceSuggestionItem = {
  provider: "GOOGLE";
  providerPlaceId: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  sessionToken?: string;
};

export type GooglePlaceDetailResponse = {
  provider: "GOOGLE";
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
  rating: number | null;
  reviewCount: number | null;
};

const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";

export function getGooglePlacesApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

export async function fetchGooglePlacesAutocomplete({
  query,
  lat,
  lng,
  sessionToken,
  apiKey,
  includedPrimaryTypes,
}: {
  query: string;
  lat: string | null;
  lng: string | null;
  sessionToken?: string | null;
  apiKey: string;
  includedPrimaryTypes?: string[];
}): Promise<GooglePlaceAutocompleteResponse> {
  const body: JsonRecord = {
    input: query,
  };

  if (sessionToken?.trim()) {
    body.sessionToken = sessionToken.trim();
  }

  if (includedPrimaryTypes?.length) {
    body.includedPrimaryTypes = includedPrimaryTypes;
  }

  if (isCoordinatePair(lat, lng)) {
    body.locationBias = {
      circle: {
        center: {
          latitude: Number(lat),
          longitude: Number(lng),
        },
        radius: 50_000,
      },
    };
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "suggestions.placePrediction.placeId",
        "suggestions.placePrediction.text.text",
        "suggestions.placePrediction.structuredFormat.mainText.text",
        "suggestions.placePrediction.structuredFormat.secondaryText.text",
        "suggestions.placePrediction.types",
      ].join(","),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getGoogleErrorMessage(data, response.status));
  }

  if (!isRecord(data) || !Array.isArray(data.suggestions)) {
    throw new Error("Google Places autocomplete response shape is invalid.");
  }

  return {
    items: data.suggestions
      .flatMap((suggestion) =>
        mapGoogleAutocompleteSuggestion(suggestion, sessionToken),
      )
      .slice(0, 8),
  };
}

export async function fetchGooglePlaceDetail({
  providerPlaceId,
  apiKey,
}: {
  providerPlaceId: string;
  apiKey: string;
}): Promise<GooglePlaceDetailResponse> {
  const url = `${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(
    providerPlaceId,
  )}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "location",
        "internationalPhoneNumber",
        "nationalPhoneNumber",
        "websiteUri",
        "photos",
        "regularOpeningHours",
        "rating",
        "userRatingCount",
        "primaryTypeDisplayName",
      ].join(","),
    },
    cache: "no-store",
  });
  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getGoogleErrorMessage(data, response.status));
  }

  if (!isRecord(data)) {
    throw new Error("Google Places detail response shape is invalid.");
  }

  return mapGooglePlaceDetail(data, providerPlaceId, apiKey);
}

export async function fetchGooglePlacesTextSearch({
  query,
  lat,
  lng,
  apiKey,
}: {
  query: string;
  lat: string | null;
  lng: string | null;
  apiKey: string;
}): Promise<GooglePlaceSearchResponse> {
  const body: JsonRecord = {
    textQuery: query,
    pageSize: 10,
  };

  if (isCoordinatePair(lat, lng)) {
    body.locationBias = {
      circle: {
        center: {
          latitude: Number(lat),
          longitude: Number(lng),
        },
        radius: 50_000,
      },
    };
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.internationalPhoneNumber",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.regularOpeningHours",
        "places.rating",
        "places.userRatingCount",
        "places.primaryTypeDisplayName",
      ].join(","),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getGoogleErrorMessage(data, response.status));
  }

  if (!isRecord(data) || !Array.isArray(data.places)) {
    throw new Error("Google Places text search response shape is invalid.");
  }

  return {
    items: data.places.flatMap((place) => {
      if (!isRecord(place)) {
        return [];
      }

      try {
        return [mapGooglePlace(place, getString(place.id) ?? query, null)];
      } catch {
        return [];
      }
    }),
  };
}

export async function fetchGooglePlacesNearby({
  lat,
  lng,
  radiusMeters,
  apiKey,
}: {
  lat: string;
  lng: string;
  radiusMeters: number;
  apiKey: string;
}): Promise<GooglePlaceSearchResponse> {
  const body = {
    locationRestriction: {
      circle: {
        center: { latitude: Number(lat), longitude: Number(lng) },
        radius: radiusMeters,
      },
    },
    maxResultCount: 20,
    rankPreference: "DISTANCE",
  };

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.primaryTypeDisplayName",
        "places.rating",
        "places.userRatingCount",
      ].join(","),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getGoogleErrorMessage(data, response.status));
  }

  if (!isRecord(data) || !Array.isArray(data.places)) {
    return { items: [] };
  }

  return {
    items: data.places.flatMap((place) => {
      if (!isRecord(place)) return [];
      try {
        return [mapGooglePlace(place, getString(place.id) ?? "nearby", null)];
      } catch {
        return [];
      }
    }),
  };
}

async function mapGooglePlaceDetail(
  value: JsonRecord,
  requestedProviderPlaceId: string,
  apiKey: string,
): Promise<GooglePlaceDetailResponse> {
  const photoName = getFirstPhotoName(value.photos);
  const photoUrl = photoName
    ? await fetchGooglePhotoUri({ photoName, apiKey })
    : null;

  return mapGooglePlace(value, requestedProviderPlaceId, photoUrl);
}

function mapGooglePlace(
  value: JsonRecord,
  requestedProviderPlaceId: string,
  photoUrl: string | null,
): GooglePlaceDetailResponse {
  const placeId = getString(value.id) ?? requestedProviderPlaceId;
  const displayName = isRecord(value.displayName) ? value.displayName : {};
  const categoryText = isRecord(value.primaryTypeDisplayName)
    ? getString(value.primaryTypeDisplayName.text)
    : null;
  const location = isRecord(value.location) ? value.location : {};
  const lat = getNumber(location.latitude);
  const lng = getNumber(location.longitude);
  const address = getString(value.formattedAddress);

  if (lat === null || lng === null) {
    throw new Error("Google Places detail is missing coordinates.");
  }

  return {
    provider: "GOOGLE",
    providerPlaceId: placeId,
    name: getString(displayName.text) ?? "Selected place",
    address,
    location: {
      lat,
      lng,
      address,
      placeId,
    },
    phone:
      getString(value.internationalPhoneNumber) ??
      getString(value.nationalPhoneNumber),
    website: getString(value.websiteUri),
    photoUrl,
    openingHours: getOpeningHoursSummary(value.regularOpeningHours),
    category: categoryText ?? undefined,
    description: categoryText ?? undefined,
    rating: getNumber(value.rating),
    reviewCount: getNumber(value.userRatingCount),
  };
}

async function fetchGooglePhotoUri({
  photoName,
  apiKey,
}: {
  photoName: string;
  apiKey: string;
}) {
  const url = new URL(`${GOOGLE_PLACES_BASE_URL}/${photoName}/media`);
  url.searchParams.set("maxWidthPx", "960");
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  const data: unknown = await response.json();

  if (!response.ok) {
    console.warn("Google Places photo request failed.", {
      component: "GooglePlacesProvider",
      operation: "fetchGooglePhotoUri",
      status: response.status,
      photoName,
    });
    return null;
  }

  if (!isRecord(data)) {
    return null;
  }

  return getString(data.photoUri);
}

function mapGoogleAutocompleteSuggestion(
  value: unknown,
  sessionToken?: string | null,
): GooglePlaceSuggestionItem[] {
  if (!isRecord(value) || !isRecord(value.placePrediction)) {
    return [];
  }

  const prediction = value.placePrediction;
  const providerPlaceId = getString(prediction.placeId);

  if (!providerPlaceId) {
    return [];
  }

  const structuredFormat = isRecord(prediction.structuredFormat)
    ? prediction.structuredFormat
    : {};
  const mainText = isRecord(structuredFormat.mainText)
    ? getString(structuredFormat.mainText.text)
    : null;
  const secondaryText = isRecord(structuredFormat.secondaryText)
    ? getString(structuredFormat.secondaryText.text)
    : null;
  const fullText = isRecord(prediction.text)
    ? getString(prediction.text.text)
    : null;

  return [
    {
      provider: "GOOGLE",
      providerPlaceId,
      mainText: mainText ?? fullText ?? "Selected place",
      secondaryText: secondaryText ?? "",
      types: getStringArray(prediction.types),
      sessionToken: sessionToken?.trim() || undefined,
    },
  ];
}

function getOpeningHoursSummary(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  const weekdayDescriptions = getStringArray(value.weekdayDescriptions);
  const openNow = typeof value.openNow === "boolean" ? value.openNow : null;
  const summary =
    openNow === null
      ? weekdayDescriptions[0]
      : openNow
        ? "Open now"
        : "Closed now";

  return {
    summary,
    weekdayDescriptions,
    openNow,
  };
}

function getFirstPhotoName(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const firstPhoto = value.find(isRecord);

  return firstPhoto ? getString(firstPhoto.name) : null;
}

function getGoogleErrorMessage(data: unknown, status: number) {
  if (isRecord(data)) {
    const error = isRecord(data.error) ? data.error : null;
    const message = getString(error?.message) ?? getString(data.message);

    if (message) {
      return message;
    }
  }

  return `Google Places request failed with status ${status}.`;
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
