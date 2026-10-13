"use client";

import type { CSSProperties } from "react";
import { Check, MapPin, Plus, Star } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import { plannerReadOnlyAtom } from "../overview/trip-builder.atoms";
import { PlaceTypeTag } from "../place/place-type-tag";
import { usePlaceDetails } from "../place/use-place-details";
import type { GuidePlace, GuideSection } from "./destination-guide";
import { GuidePlacePhoto, useIsPlaceInDay } from "./guide-place-photo";
import { addGuidePlaceToDayAtom } from "./guide.atoms";

type GuidePlaceCardProps = {
  place: GuidePlace;
  section: Pick<GuideSection, "id" | "colorId" | "iconId">;
  position: number;
  blockId: string;
  dayLabel: string;
  selected: boolean;
  onSelect: (placeId: string) => void;
};

function formatReviewCount(count: number): string {
  return new Intl.NumberFormat("en", { notation: count >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(count);
}

export function GuidePlaceCard({ place, section, position, blockId, dayLabel, selected, onSelect }: GuidePlaceCardProps) {
  const details = usePlaceDetails(place.id);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const isInDay = useIsPlaceInDay(blockId, place.id);
  const addToDay = useSetAtom(addGuidePlaceToDayAtom);
  const color = getTripBlockColorById(section.colorId);
  const live = details.data;
  const selectedStyle: CSSProperties | undefined = selected
    ? ({
        borderColor: color.value,
        "--surface-ring": `0 0 0 2px color-mix(in oklch, ${color.value} 28%, transparent)`,
      } as CSSProperties)
    : undefined;

  return (
    <article
      className={cn("surface-card relative min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 dark:border-border/70", selected && "border-2")}
      style={selectedStyle}
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <span
              role="img"
              aria-label={`Map pin ${position}`}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: color.value, color: color.foreground }}
            >
              {position}
            </span>
            <div className="min-w-0 space-y-1.5">
              <h3 className="text-base leading-snug font-bold wrap-break-word text-foreground">{place.name}</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {live?.rating ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    <Star className="size-3 fill-rating text-rating" aria-hidden="true" />
                    {live.rating.toFixed(1)}
                    {live.reviewCount ? <span className="text-muted-foreground">({formatReviewCount(live.reviewCount)})</span> : null}
                  </span>
                ) : null}
                {place.category ? <PlaceTypeTag label={place.category} placeType={place.primaryType} /> : null}
              </div>
            </div>
          </div>
          <p className={cn("text-sm leading-6 text-muted-foreground", !selected && "line-clamp-3")}>{place.blurb}</p>
          {selected && place.address ? (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {place.address}
            </p>
          ) : null}
        </div>
        <GuidePlacePhoto
          section={section}
          imageUrl={live?.imageUrl}
          isLoading={details.isLoading}
          sizes="7rem"
          className="size-20 shrink-0 rounded-lg @md/planner:size-28"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Tags">
          {place.tags.map((tag) => (
            <li key={tag}><Badge variant="outline" className="text-muted-foreground">{tag}</Badge></li>
          ))}
        </ul>
        {!readOnly && (
          <Button
            type="button"
            size="sm"
            variant={isInDay ? "secondary" : "default"}
            disabled={isInDay}
            className="relative z-10"
            aria-label={isInDay ? `${place.name} is already in ${dayLabel}` : `Add ${place.name} to ${dayLabel}`}
            onClick={() => addToDay({
              blockId,
              place: { ...place, imageUrl: live?.imageUrl, rating: live?.rating, reviewCount: live?.reviewCount },
            })}
          >
            {isInDay ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {isInDay ? `In ${dayLabel}` : `Add to ${dayLabel}`}
          </Button>
        )}
      </div>

      {/* Covers the card so any click selects it; the add button sits above it. */}
      <button
        type="button"
        aria-label={`Show ${place.name} on the map`}
        aria-pressed={selected}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={() => onSelect(place.id)}
      />
    </article>
  );
}
