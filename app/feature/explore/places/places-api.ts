import { z } from "zod";
import { placesRequest } from "./places-request";

export const collections = [
  {
    id: "seasonal",
    title: "Seasonal picks",
    description: "A little inspiration for the time of year.",
  },
  {
    id: "popular",
    title: "Popular places",
    description: "Established favorites, ranked by Google popularity.",
  },
  {
    id: "hidden-gems",
    title: "Hidden gems",
    description: "Highly rated places with fewer reviews in this collection.",
  },
  {
    id: "worth-a-visit",
    title: "Worth a visit",
    description: "Make room for a different side of your destination.",
  },
  {
    id: "scenic",
    title: "Scenic spots",
    description: "Gardens, viewpoints, and room to slow down.",
  },
  {
    id: "food",
    title: "Food & cafés",
    description: "Somewhere to stop, sit, and taste the neighborhood.",
  },
  {
    id: "things-to-do",
    title: "Things to do",
    description: "Culture, recreation, and something new to try.",
  },
] as const;
export type CollectionId = (typeof collections)[number]["id"];
export const destinationSchema = z.object({
  name: z.string().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type DiscoveryDestination = z.infer<typeof destinationSchema>;
const placeSchema = z.object({
  providerPlaceId: z.string().min(1),
  name: z.string(),
  address: z.string().nullish(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  photoUrl: z.string().nullish(),
  category: z.string().nullish(),
  description: z.string().nullish(),
  rating: z.number().nullish(),
  reviewCount: z.number().nullish(),
  website: z.string().nullish(),
  phone: z.string().nullish(),
  openingHours: z
    .object({
      summary: z.string().nullish(),
      weekdayDescriptions: z.array(z.string()).nullish(),
    })
    .nullish(),
});
export const discoveryItemSchema = z.object({
  photos: z
    .array(
      z.object({
        url: z.string(),
        attributions: z
          .array(
            z.object({
              displayName: z.string(),
              uri: z.string().nullish(),
              photoUri: z.string().nullish(),
            }),
          )
          .default([]),
        googleMapsUri: z.string().nullish(),
      }),
    )
    .default([]),
  place: placeSchema,
  reason: z.string().nullish(),
  businessStatus: z.string().nullish(),
  photoAttributions: z
    .array(
      z.object({
        displayName: z.string(),
        uri: z.string().nullish(),
        photoUri: z.string().nullish(),
      }),
    )
    .default([]),
  photoGoogleMapsUri: z.string().nullish(),
});
export type DiscoveryItem = z.infer<typeof discoveryItemSchema>;
export const discoveryPageSchema = z.object({
  items: z.array(discoveryItemSchema),
  hasMore: z.boolean(),
  seasonal: z
    .object({
      label: z.string(),
      description: z.string(),
      sourceUrl: z.string(),
    })
    .nullable(),
});
export async function discoverPlaces(
  destination: DiscoveryDestination,
  month: number,
  collection: CollectionId,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    destination: destination.name,
    lat: String(destination.lat),
    lng: String(destination.lng),
    month: String(month),
    collection,
    page: String(page),
    size: "4",
  });
  const response = await placesRequest(
    `/api/geo/places/discovery?${params}`,
    signal,
  );
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Places are busy right now. Please try again shortly."
        : "Places could not be loaded. Please try again.",
    );
  return discoveryPageSchema.parse(await response.json());
}
export async function readPlace(id: string, signal?: AbortSignal) {
  const response = await placesRequest(
    `/api/geo/places/${encodeURIComponent(id)}/reader`,
    signal,
  );
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "This place is no longer available."
        : "This place could not be loaded. Please try again.",
    );
  return discoveryItemSchema.parse(await response.json());
}
export function safeExternalUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
