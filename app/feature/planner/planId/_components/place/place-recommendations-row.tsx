"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useViewer } from "@/hooks/use-social";
import { getPlaceRecommendations, placePopularityKeys } from "@/lib/place-popularity-api";

import { isPersistedTripId } from "../../../_components/planner-api";
import { isEvChargerPlaceItem, isPlaceItem, type PlaceSearchResult, type TripBlockData } from "../constants/types";
import { destinationGuidesAtom } from "../guide/guide.atoms";
import { GuidePlacePhoto } from "../guide/guide-place-photo";
import { addPlaceVisitToBlockAtom, itineraryBlocksAtom, plannerReadOnlyAtom, startPlaceSearchAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";
import type { PlaceSearchBias } from "./add-place-input";
import {
  buildPlaceRecommendations,
  canonicalPlaceId,
  describeRecommendation,
  type PlaceRecommendation,
  type RecommendationContext,
} from "./place-recommendations";
import { getPlaceReference } from "./use-place-details";

function RecommendationPhoto({ place, section }: Pick<PlaceRecommendation, "place" | "section">) {
  const reference = getPlaceReference(place.id);
  // Observe a detail already fetched elsewhere in the planner; this observer cannot initiate a request.
  const cached = useQuery<PlaceSearchResult>({
    queryKey: ["place-details", reference?.provider, reference?.providerPlaceId],
    queryFn: skipToken,
  });
  return <GuidePlacePhoto section={section} imageUrl={place.imageUrl ?? cached.data?.imageUrl} isLoading={false} sizes="3rem" className="size-12 shrink-0 rounded-md" />;
}

/**
 * What the trip already holds, for ranking this day's shelf. Places added from
 * this shelf are left out, so the cards stay put (showing a check) instead of
 * vanishing or reshuffling under the pointer; the next visit re-ranks.
 */
function recommendationContext(days: readonly TripBlockData[], blockId: string, addedHere: ReadonlySet<string>): RecommendationContext {
  const plannedIds = new Set<string>();
  for (const day of days) for (const item of day.items) {
    if (!isPlaceItem(item)) continue;
    const id = canonicalPlaceId(item.placeId);
    if (!addedHere.has(id)) plannedIds.add(id);
  }
  const day = days.find((entry) => entry.id === blockId);
  const dayStops = (day?.items ?? []).filter(isPlaceItem)
    .filter((item) => !isEvChargerPlaceItem(item) && !addedHere.has(canonicalPlaceId(item.placeId)));
  return { plannedIds, dayStops, dayIndex: Math.max(0, days.findIndex((entry) => entry.id === blockId)) };
}

/** Small reusable shelf; it never fetches provider details or photos for its cards. */
export function PlaceRecommendationsRow({ blockId, searchBias }: { blockId: string; searchBias: PlaceSearchBias }) {
  const { planId } = useParams<{ planId?: string }>();
  const viewer = useViewer();
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const guides = useAtomValue(destinationGuidesAtom);
  const popularity = useQuery({
    queryKey: [...placePopularityKeys.recommendations, viewer.accountId, planId, searchBias.lat, searchBias.lng],
    queryFn: ({ signal }) => getPlaceRecommendations(planId!, searchBias.lat, searchBias.lng, signal),
    enabled: !readOnly && viewer.signedIn && isPersistedTripId(planId),
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const days = useAtomValue(itineraryBlocksAtom);
  const [addedHere, setAddedHere] = useState<ReadonlySet<string>>(() => new Set());
  const onAdded = useCallback((placeId: string) => setAddedHere((ids) => new Set(ids).add(canonicalPlaceId(placeId))), []);
  const evidence = viewer.signedIn ? popularity.data : undefined;
  const items = useMemo(() => buildPlaceRecommendations(
    { id: "", name: searchBias.label, lat: searchBias.lat, lng: searchBias.lng },
    guides, evidence, 6, recommendationContext(days, blockId, addedHere),
  ), [searchBias.label, searchBias.lat, searchBias.lng, guides, evidence, days, blockId, addedHere]);
  if (readOnly || items.length === 0) return null;
  return <PlaceSuggestions blockId={blockId} items={items} onAdded={onAdded} />;
}

/** Presentation is separate so the same add/preview behavior works with either evidence source. */
export function PlaceSuggestions({ blockId, items, onAdded }: {
  blockId: string;
  items: readonly PlaceRecommendation[];
  /** Told which place was added, so the parent can keep its card in place. */
  onAdded?: (placeId: string) => void;
}) {
  const titleId = useId();
  const blocks = useAtomValue(tripBlocksAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const add = useSetAtom(addPlaceVisitToBlockAtom);
  const preview = useSetAtom(startPlaceSearchAtom);
  const block = blocks.find((entry) => entry.id === blockId);
  const selected = new Set(block?.items.filter(isPlaceItem).map((item) => canonicalPlaceId(item.placeId)));
  // Only claim popularity when every card has traveler evidence behind it.
  const allPopular = items.length > 0 && items.every((item) => item.travelerCount !== undefined);
  const label = allPopular ? "Popular places from travelers" : "Recommended places";
  if (readOnly || !block || items.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="@container/suggestions min-w-0">
      <Accordion defaultValue={["places"]}>
        <AccordionItem value="places" className="border-0">
          <AccordionTrigger id={titleId} iconSide="left" className="min-h-9 w-fit flex-none justify-start gap-2 rounded-md py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline">
            {label}
          </AccordionTrigger>
          <AccordionContent className="pb-0 motion-reduce:animate-none">
            <Carousel opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }} aria-label={label}>
              <CarouselContent className="-ml-2 pb-0.5">
                {items.map(({ place, section, reason }, index) => {
                  const added = selected.has(canonicalPlaceId(place.id));
                  return (
                    <CarouselItem key={place.id} className="basis-[min(82%,16rem)] pl-2 @sm/suggestions:basis-1/2">
                      <article className="flex items-center gap-1 overflow-hidden rounded-lg border border-dashed border-border bg-background/40 p-1.5">
                        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 self-stretch rounded-md pr-1 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          aria-label={`Preview ${place.name}`}
                          onClick={() => preview({ blockId, query: "", results: items.map((item) => item.place), selectedIndex: index })}>
                          <RecommendationPhoto place={place} section={section} />
                          <span className="flex min-w-0 flex-col gap-0.5 py-1">
                            <span className="line-clamp-2 text-sm leading-tight font-medium text-foreground">{place.name}</span>
                            <span className="truncate text-[11px] leading-snug text-muted-foreground">{describeRecommendation(reason)}</span>
                          </span>
                        </button>
                        <Button type="button" variant="ghost" size="icon-lg" className="size-10 rounded-full bg-muted/65 text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-100 disabled:text-primary"
                          disabled={added} aria-label={added ? `${place.name} is already in this day` : `Add ${place.name} to this day`}
                          onClick={() => { onAdded?.(place.id); add({ blockId, place: { ...place, placeId: place.id, placeType: place.primaryType } }); }}>
                          {added ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                        </Button>
                      </article>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              {items.length > 2 && <div className="mt-1 flex justify-end gap-1">
                <CarouselPrevious className="static size-7 translate-y-0 border-0 bg-transparent shadow-none" />
                <CarouselNext className="static size-7 translate-y-0 border-0 bg-transparent shadow-none" />
              </div>}
            </Carousel>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
