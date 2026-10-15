import { z } from "zod";
import { discoveryItemSchema } from "./places-api";
import { placesRequest } from "./places-request";
import type { PlaceSearchState } from "./search-state";
const exploreSchema = z.object({
  items: z.array(discoveryItemSchema),
  recommendationIds: z.array(z.string()),
  cursor: z.string().nullable(),
  mode: z.enum(["results", "discovery"]),
  seasonalNotice: z.string().nullable(),
  seasonalSources: z.array(z.string()),
});
const suggestionSchema = z.object({
  items: z.array(
    z.object({
      kind: z.enum(["query", "place"]),
      label: z.string(),
      value: z.string(),
      placeId: z.string().nullable(),
      interest: z.string().nullable(),
    }),
  ),
  providerAvailable: z.boolean(),
});
export type PlaceSuggestion = z.infer<typeof suggestionSchema>["items"][number];
export class PlaceExploreError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PlaceExploreError";
  }
}
export async function explorePlaces(
  state: PlaceSearchState,
  collection: string,
  destination: string,
  cursor: string,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({
    country: state.country,
    query: state.query,
    time: state.time,
    collection,
    destination,
    cursor,
  });
  state.interests.forEach((v) => params.append("interest", v));
  state.types.forEach((v) => params.append("type", v));
  const response = await placesRequest(
    `/api/geo/places/explore?${params}`,
    signal,
  );
  if (!response.ok)
    throw new PlaceExploreError(
      response.status === 429
        ? "Places are busy. Please try again shortly."
        : response.status === 400
          ? "This search has expired or changed. Start the search again."
          : "Places could not be loaded. Please try again.",
      response.status,
    );
  return exploreSchema.parse(await response.json());
}
export async function suggestPlaces(
  query: string,
  country: string,
  signal: AbortSignal,
) {
  const response = await placesRequest(
    `/api/geo/places/explore/suggestions?${new URLSearchParams({ query, country })}`,
    signal,
  );
  if (!response.ok)
    throw new Error(
      "Suggestions are unavailable. You can still submit your search.",
    );
  return suggestionSchema.parse(await response.json());
}
