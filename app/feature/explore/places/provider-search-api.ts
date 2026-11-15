import { z } from "zod";
import { isCatalogueId } from "./catalogue";
import type { BookmarkLocation } from "../../saved/library-model";
import { placesRequest } from "./places-request";

/**
 * Places Release 2: explicit "Search beyond Navio's catalogue". Off unless the deployment sets
 * NEXT_PUBLIC_PLACES_PROVIDER_SEARCH=true; the backend has its own switch and is off by default.
 * Only a user's button press may start a request; nothing here runs on load, focus or empty results.
 */
export const providerSearchEnabled =
  process.env.NEXT_PUBLIC_PLACES_PROVIDER_SEARCH === "true";
export const PROVIDER_QUERY_MIN = 2;
export const PROVIDER_QUERY_MAX = 120;

const itemSchema = z.object({
  providerPlaceId: z.string().min(1).max(512),
  name: z.string().min(1),
  address: z.string().nullish(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.string().nullish(),
  primaryType: z.string().nullish(),
  countryCode: z.string().nullish(),
  city: z.string().nullish(),
  googleMapsUri: z.string().nullish(),
});
const pageSchema = z.object({
  items: z.array(z.unknown()),
  cursor: z.string().nullable(),
  page: z.number().int().min(1),
  maxPages: z.number().int().min(1),
  source: z.literal("GOOGLE"),
});
export type ProviderPlace = z.infer<typeof itemSchema>;
export type ProviderSearchPage = Omit<z.infer<typeof pageSchema>, "items"> & {
  items: ProviderPlace[];
};

export class ProviderSearchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Only a transient refusal (busy instance, outage) may be retried; used-up limits may not. */
    public readonly retryable = status !== 401 && status !== 429,
  ) {
    super(message);
    this.name = "ProviderSearchError";
  }
}

export function canSearchProvider(query: string) {
  const length = query.trim().length;
  return length >= PROVIDER_QUERY_MIN && length <= PROVIDER_QUERY_MAX;
}

/** Drops malformed items and any item claiming a Navio catalogue identity. */
export function parseProviderPage(body: unknown): ProviderSearchPage {
  const page = pageSchema.parse(body);
  const items = page.items.flatMap((raw) => {
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success || isCatalogueId(parsed.data.providerPlaceId)) return [];
    return [parsed.data];
  });
  return { ...page, items };
}

function errorMessage(status: number, detail: string | undefined) {
  if (status === 401) return "Sign in to search Google Maps.";
  if (status === 429)
    return detail || "Searches beyond the catalogue are used up for now.";
  if (status === 400)
    return "This search has expired or changed. Start the search again.";
  if (status === 503)
    return "Google Maps search is unavailable right now.";
  return "Google Maps results could not be loaded.";
}

export async function searchProviderPlaces(
  query: string,
  country: string,
  cursor: string,
  signal: AbortSignal,
): Promise<ProviderSearchPage> {
  const params = new URLSearchParams({ query: query.trim(), country, cursor });
  const response = await placesRequest(`/api/geo/place-searches?${params}`, signal);
  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string")
        detail = body.error;
    } catch {
      detail = undefined;
    }
    console.warn("[ProviderSearch] Google Maps search failed", { status: response.status });
    const busy = response.status === 429 && response.headers.has("retry-after");
    throw new ProviderSearchError(
      busy ? "Google Maps search is busy. Try again in a moment." : errorMessage(response.status, detail),
      response.status,
      busy || (response.status !== 401 && response.status !== 429),
    );
  }
  return parseProviderPage(await response.json());
}

/** A Google Maps link costs nothing: the result's own link, else the public search URL. */
export function providerMapsUrl(place: Pick<ProviderPlace, "providerPlaceId" | "name" | "googleMapsUri">) {
  if (place.googleMapsUri?.startsWith("https://")) return place.googleMapsUri;
  const params = new URLSearchParams({ api: "1", query: place.name, query_place_id: place.providerPlaceId });
  return `https://www.google.com/maps/search/?${params}`;
}

/** The Google identity is kept as-is; it is never rewritten into the NAVIO: namespace. */
export function providerBookmark(place: ProviderPlace): BookmarkLocation {
  return {
    providerPlaceId: place.providerPlaceId,
    name: place.name,
    address: place.address ?? null,
    location: { lat: place.lat, lng: place.lng },
    category: place.category ?? null,
    country: place.countryCode ?? null,
    city: place.city ?? null,
  };
}
