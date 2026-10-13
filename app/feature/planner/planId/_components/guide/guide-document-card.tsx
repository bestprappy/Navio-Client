"use client";

import type { CSSProperties, ReactNode } from "react";
import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { PlaceCardFrame } from "../block/items/place-card-frame";
import { PlaceCardVisual } from "../block/items/place-card-visual";
import { getTripBlockColorById } from "../constants/trip-block-colors";
import type { TripBlockColorId } from "../constants/types";
import { PlaceOpeningHours } from "../place/place-opening-hours";
import { usePlaceDetails } from "../place/use-place-details";

type GuideDocumentCardProps = {
  /** `PROVIDER:id`, which loads the live photo, rating and hours. */
  place: { id: string; name: string; address?: string; category?: string; primaryType?: string };
  number: number | null;
  colorId: TripBlockColorId;
  selected: boolean;
  onSelect: () => void;
  /** The left of the card's footer: the place's tags. */
  footerStart?: ReactNode;
  /** The right of the card's footer: an action, such as Add to day. */
  children?: ReactNode;
};

/** A place's tags as the planner's guide cards show them. */
export function GuidePlaceTagList({ tags }: { tags: readonly string[] }) {
  if (!tags.length) return null;
  return (
    <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>
          <Badge variant="outline" className="text-muted-foreground">
            {tag}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/**
 * A place in a written guide: the planner's own place card with its photo,
 * rating, type, address and opening hours. The guide editor and the planner's
 * guide view both draw it, so a guide reads the same in both.
 */
export function GuideDocumentCard({ place, number, colorId, selected, onSelect, footerStart, children }: GuideDocumentCardProps) {
  const details = usePlaceDetails(place.id);
  const live = details.data;
  const color = getTripBlockColorById(colorId).value;
  const selectedStyle: CSSProperties | undefined = selected
    ? ({ borderColor: color, "--surface-ring": `0 0 0 2px color-mix(in oklch, ${color} 28%, transparent)` } as CSSProperties)
    : undefined;

  return (
    <PlaceCardFrame className={selected ? "cursor-pointer border-2" : "cursor-pointer"} style={selectedStyle} onClick={onSelect}>
      <PlaceCardVisual
        name={place.name}
        imageUrl={live?.imageUrl}
        rating={live?.rating}
        reviewCount={live?.reviewCount}
        address={place.address || live?.address}
        description={live?.category ?? place.category}
        placeType={live?.primaryType ?? place.primaryType}
        position={number}
        colorId={colorId}
      />
      <PlaceOpeningHours placeId={place.id} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-3" onClick={(event) => event.stopPropagation()}>
        <div className="min-w-0 flex-1">{footerStart}</div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Show ${place.name} on the map`} aria-pressed={selected} onClick={onSelect} className="text-muted-foreground">
            <MapPin aria-hidden="true" />
          </Button>
          {children}
        </div>
      </div>
    </PlaceCardFrame>
  );
}
