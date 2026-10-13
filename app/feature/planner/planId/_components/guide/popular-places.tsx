"use client";

import { Check, Plus } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import type { TripDestination } from "../constants/types";
import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { usePlaceDetails } from "../place/use-place-details";
import { findDestinationGuide, getGuidePicks, type GuidePick } from "./destination-guide";
import { formatGuideDayLabel, guideBrowseButtonId, revealGuidePlaceCard } from "./guide-dom";
import { GuidePlacePhoto, guideSectionTint, useIsPlaceInDay } from "./guide-place-photo";
import { addGuidePlaceToDayAtom, destinationGuidesAtom, openGuideAtPlaceAtom, openGuideBrowserAtom } from "./guide.atoms";

const PICK_COUNT = 9;
const ARROW_CLASS = "static size-7 translate-y-0";

type PopularPlaceCardProps = {
  pick: GuidePick;
  guideName: string;
  blockId: string;
  dayLabel: string;
  onOpen: (placeId: string) => void;
};

function PopularPlaceCard({ pick, guideName, blockId, dayLabel, onOpen }: PopularPlaceCardProps) {
  const { place, section } = pick;
  const details = usePlaceDetails(place.id);
  const isInDay = useIsPlaceInDay(blockId, place.id);
  const addToDay = useSetAtom(addGuidePlaceToDayAtom);

  return (
    <article className="surface-card relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="relative">
        <GuidePlacePhoto section={section} imageUrl={details.data?.imageUrl} isLoading={details.isLoading} sizes="9rem" className="aspect-4/3 w-full" />
        <Button
          type="button"
          size="icon-sm"
          variant={isInDay ? "secondary" : "outline"}
          disabled={isInDay}
          className="absolute right-2 bottom-2 z-10 rounded-full shadow-md not-disabled:bg-background/95 not-disabled:hover:bg-background dark:not-disabled:bg-background/90 dark:not-disabled:hover:bg-background"
          aria-label={isInDay ? `${place.name} is already in ${dayLabel}` : `Add ${place.name} to ${dayLabel}`}
          onClick={() => addToDay({
            blockId,
            place: { ...place, imageUrl: details.data?.imageUrl, rating: details.data?.rating, reviewCount: details.data?.reviewCount },
          })}
        >
          {isInDay ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <h5 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">{place.name}</h5>
        <div className="mt-auto flex flex-wrap gap-1">
          {place.tags.slice(0, 2).map((tag, index) => (
            <Badge key={tag} variant="secondary" style={index === 0 ? guideSectionTint(section) : undefined}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      {/* The whole card opens the guide on this place; the add button sits above it. */}
      <button
        type="button"
        aria-label={`Open ${place.name} in the ${guideName} guide`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={() => onOpen(place.id)}
      />
    </article>
  );
}

/** Shown on a day only when Navio has a guide for that day's destination. */
export function PopularPlaces({ blockId, destination }: { blockId: string; destination: TripDestination }) {
  const openBrowser = useSetAtom(openGuideBrowserAtom);
  const openAtPlace = useSetAtom(openGuideAtPlaceAtom);
  const date = useAtomValue(tripBlocksAtom).find((block) => block.id === blockId)?.date;
  const guide = findDestinationGuide(destination, useAtomValue(destinationGuidesAtom));
  if (!guide) return null;
  const titleId = `popular-places-${blockId}`;
  const dayLabel = formatGuideDayLabel(date);

  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <Carousel opts={{ align: "start", dragFree: true }} aria-label={`Popular places in ${guide.name}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 id={titleId} className="text-sm font-semibold text-foreground">
            Popular places in {guide.name}
          </h4>
          <div className="flex items-center gap-1">
            <CarouselPrevious className={ARROW_CLASS} />
            <CarouselNext className={ARROW_CLASS} />
            <Button
              id={guideBrowseButtonId(blockId)}
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary"
              aria-label={`Browse all popular places in ${guide.name}`}
              onClick={() => openBrowser({ guideId: guide.id, blockId })}
            >
              Browse all
            </Button>
          </div>
        </div>
        <CarouselContent className="-ml-3">
          {getGuidePicks(guide, PICK_COUNT).map((pick) => (
            <CarouselItem key={pick.place.id} className="basis-36 pl-3">
              <PopularPlaceCard
                pick={pick}
                guideName={guide.name}
                blockId={blockId}
                dayLabel={dayLabel}
                onOpen={(placeId) => {
                  openAtPlace({ guideId: guide.id, blockId, placeId });
                  revealGuidePlaceCard(placeId);
                }}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
