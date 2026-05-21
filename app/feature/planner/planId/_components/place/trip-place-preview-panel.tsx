"use client";

import Image from "next/image";
import { MapPin, Star, X } from "lucide-react";

import type { TripPlaceAnchor } from "../overview/trip-builder.atoms";

type TripPlacePreviewPanelProps = {
  place: TripPlaceAnchor;
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

export function TripPlacePreviewPanel({
  place,
  onClose,
}: TripPlacePreviewPanelProps) {
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
            Saved to trip
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="Close trip place preview"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold leading-tight text-foreground">
              {place.name}
            </h2>
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
            ) : null}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{place.address}</span>
            </div>
            {place.notes ? (
              <p className="rounded-sm bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
                {place.notes}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
