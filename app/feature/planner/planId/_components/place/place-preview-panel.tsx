"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ExternalLink,
  MapPin,
  MessageSquareOff,
  Phone,
  Star,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PlaceNotesPreview } from "../block/items/place-notes";
import { StationOpeningHours } from "../charger/station-opening-hours";

import type { PlaceSearchResult } from "./place-api";
import { PlaceTypeTag } from "./place-type-tag";

type PlacePreviewDetails = Pick<
  PlaceSearchResult,
  | "name"
  | "address"
  | "imageUrl"
  | "category"
  | "description"
  | "primaryType"
  | "rating"
  | "reviewCount"
  | "openingHours"
  | "phone"
  | "website"
> & { notes?: string };

type PlacePreviewPanelProps = {
  place: PlacePreviewDetails;
  currentIndex?: number;
  total?: number;
  isAdded: boolean;
  usageLabel?: string;
  targetLabel?: string;
  insertionLabel?: string;
  addUnavailableReason?: string;
  showAddAction?: boolean;
  savedToTrip?: boolean;
  isLoadingDetails?: boolean;
  canAddToTrip?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onAddToTrip?: () => void;
  onClose: () => void;
  /** Replaces the "Saved to trip" / "1 of 3" label, for hosts other than a trip. */
  statusLabel?: string;
  /** Replaces the add button's text, for hosts other than a trip. */
  addLabel?: string;
  /** Shown above the add button in place of "To …", such as a picker for where the place goes. */
  addTarget?: ReactNode;
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
  currentIndex = 0,
  total = 1,
  isAdded,
  usageLabel,
  targetLabel,
  insertionLabel,
  addUnavailableReason,
  showAddAction = true,
  savedToTrip = false,
  isLoadingDetails = false,
  canAddToTrip = true,
  onPrevious,
  onNext,
  onAddToTrip,
  onClose,
  statusLabel,
  addLabel,
  addTarget,
}: PlacePreviewPanelProps) {
  return (
    <aside aria-label="Place details" className="absolute bottom-4 left-4 right-4 z-10 max-h-[calc(100%-2rem)] overflow-y-auto rounded-sm border border-border bg-card text-card-foreground shadow-xl">
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
            {statusLabel ?? (savedToTrip ? "Saved to trip" : `${currentIndex + 1} of ${total}`)}
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
                <PlaceTypeTag
                  label={place.category}
                  placeType={place.primaryType}
                  className="px-2"
                />
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
                  className="size-4 fill-rating text-rating"
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

            <div className="flex items-start gap-2 py-1">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words leading-relaxed">{place.address}</span>
            </div>

            {isLoadingDetails ? (
              <p role="status" className="text-xs text-muted-foreground">Loading opening hours…</p>
            ) : (
              <StationOpeningHours value={place.openingHours} />
            )}

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

            {place.notes ? (
              <div className="rounded-sm bg-muted/60 p-3">
                <PlaceNotesPreview value={place.notes} interactive clamped={false} />
              </div>
            ) : null}
          </div>
        </div>

        {showAddAction || !savedToTrip ? <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
          {!savedToTrip ? (
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
          ) : null}

          {showAddAction ? <div className="ml-auto flex max-w-full flex-col items-end gap-1.5">
            {usageLabel ? <p role="status" className="flex items-center gap-1.5 text-right text-xs text-muted-foreground">
              <Check className="size-3.5 shrink-0" aria-hidden="true" />{usageLabel}
            </p> : null}
            {addTarget}
            <Button
              type="button"
              size="sm"
              className="rounded-sm"
              onClick={onAddToTrip}
              disabled={!canAddToTrip || !onAddToTrip}
              aria-label={targetLabel && onAddToTrip ? `${isAdded ? "Add another visit to" : "Add to"} ${targetLabel}${insertionLabel ? `, ${insertionLabel.toLowerCase()}` : ""}` : undefined}
            >
              {addLabel ?? (isAdded ? onAddToTrip ? "Add another visit" : "Added" : "Add to trip")}
            </Button>
            {targetLabel && canAddToTrip ? <p className="text-right text-xs text-muted-foreground">To {targetLabel}{insertionLabel ? <span className="block">{insertionLabel}</span> : null}</p> : null}
            {!canAddToTrip ? (
              <p className="text-xs text-muted-foreground">
                {addUnavailableReason ?? "Add a day to your itinerary first"}
              </p>
            ) : null}
          </div> : null}
        </div> : null}
      </div>
    </aside>
  );
}
