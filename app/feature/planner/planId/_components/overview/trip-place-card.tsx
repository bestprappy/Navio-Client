"use client";

import Image from "next/image";
import { MapPin, Star, Trash2 } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  removeItemFromBlockAtom,
  selectedTripPlaceItemIdReadonlyAtom,
  selectTripPlaceAtom,
  updatePlaceItemAtom,
} from "./trip-builder.atoms";
import { PlaceItem } from "../constants/types";

type TripPlaceCardProps = {
  blockId: string;
  item: PlaceItem;
  position: number;
};

function formatReviewCount(count: number): string {
  return new Intl.NumberFormat("en", {
    notation: count >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}

function isGooglePlacePhoto(imageUrl?: string): boolean {
  return Boolean(
    imageUrl &&
      (imageUrl.includes("googleusercontent.com") ||
        imageUrl.includes("places.googleapis.com") ||
        imageUrl.includes("maps.googleapis.com")),
  );
}

export function TripPlaceCard({ blockId, item, position }: TripPlaceCardProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
  const selectTripPlace = useSetAtom(selectTripPlaceAtom);
  const selectedTripPlaceItemId = useAtomValue(
    selectedTripPlaceItemIdReadonlyAtom,
  );
  const isSelected = selectedTripPlaceItemId === item.id;

  return (
    <article
      className={cn(
        "cursor-pointer overflow-hidden transition-all duration-300 ease-in-out rounded-sm border bg-card shadow-xs active:scale-95",
        isSelected
          ? "  border-secondary  border-2  ring-2 ring-secondary/30"
          : "border-border",
      )}
      onClick={() => selectTripPlace({ itemId: item.id })}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          width={640}
          height={240}
          unoptimized={isGooglePlacePhoto(item.imageUrl)}
          className="h-32 w-full object-cover"
        />
      ) : null}

      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {position}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold leading-snug text-foreground">
                {item.name}
              </h3>
              {item.rating ? (
                <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  <Star
                    className="size-3 fill-primary text-primary"
                    aria-hidden="true"
                  />
                  {item.rating.toFixed(1)}
                  {item.reviewCount ? (
                    <span className="text-muted-foreground">
                      ({formatReviewCount(item.reviewCount)})
                    </span>
                  ) : null}
                </span>
              ) : null}
              {item.description ? (
                <span className="inline-flex items-center rounded-sm bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {item.description}
                </span>
              ) : null}
            </div>

            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{item.address}</span>
            </p>
          </div>
        </div>

        <textarea
          value={item.notes ?? ""}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            updatePlaceItem({
              blockId,
              itemId: item.id,
              updates: { notes: event.target.value },
            })
          }
          placeholder="Add notes, links, etc. here"
          aria-label={`Notes for ${item.name}`}
          rows={3}
          className="min-h-20 w-full resize-y rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
          <Button
            type="button"
            variant={item.isVisited ? "secondary" : "outline"}
            size="sm"
            className="rounded-sm"
            onClick={(event) => {
              event.stopPropagation();
              updatePlaceItem({
                blockId,
                itemId: item.id,
                updates: { isVisited: !item.isVisited },
              });
            }}
          >
            {item.isVisited ? "Visited" : "Mark as visited"}
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={`Delete ${item.name}`}
            onClick={(event) => {
              event.stopPropagation();
              removeItemFromBlock({ blockId, itemId: item.id });
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
