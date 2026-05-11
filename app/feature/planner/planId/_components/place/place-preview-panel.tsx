"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  MessageSquareOff,
  Phone,
  Star,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { PlaceSearchResult } from "./place-api";

type PlacePreviewPanelProps = {
  place: PlaceSearchResult;
  currentIndex: number;
  total: number;
  isAdded: boolean;
  canAddToTrip?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onAddToTrip: () => void;
  onClose: () => void;
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

export function PlacePreviewPanel({
  place,
  currentIndex,
  total,
  isAdded,
  canAddToTrip = true,
  onPrevious,
  onNext,
  onAddToTrip,
  onClose,
}: PlacePreviewPanelProps) {
  return (
    <aside className="absolute bottom-4 left-4 right-4 z-10 overflow-hidden rounded-sm border border-border bg-card text-card-foreground shadow-xl">
      {place.imageUrl ? (
        <div className="relative h-32 w-full bg-muted sm:h-36">
          <Image
            src={place.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) calc(100vw - 2rem), 420px"
            unoptimized={isGooglePlacePhoto(place.imageUrl)}
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-sm bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {currentIndex + 1} of {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="Close place preview"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {place.name}
              </h2>
              {place.category ? (
                <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {place.category}
                </span>
              ) : null}
            </div>

            {place.description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {place.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            {place.rating ? (
              <div className="flex items-center gap-2">
                <Star
                  className="size-4 fill-yellow-400 text-yellow-400"
                  aria-hidden="true"
                />
                <span>
                  {place.rating.toFixed(1)}
                  {place.reviewCount
                    ? ` (${formatReviewCount(place.reviewCount)} reviews)`
                    : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <MessageSquareOff className="size-3.5" aria-hidden="true" />
                <span>Reviews not available yet</span>
              </div>
            )}

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{place.address}</span>
            </div>

            {place.openingHours ? (
              <div className="text-foreground">{place.openingHours}</div>
            ) : null}

            {place.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="size-4" aria-hidden="true" />
                <span>{place.phone}</span>
              </div>
            ) : null}

            {place.website ? (
              <a
                href={place.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                Website
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-sm"
              onClick={onPrevious}
              disabled={total <= 1}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-sm"
              onClick={onNext}
              disabled={total <= 1}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              size="sm"
              className="rounded-sm"
              onClick={onAddToTrip}
              disabled={isAdded || !canAddToTrip}
            >
              {isAdded ? "Added" : "Add to trip"}
            </Button>
            {!canAddToTrip ? (
              <p className="text-xs text-muted-foreground">
                Add a day to your itinerary first
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
