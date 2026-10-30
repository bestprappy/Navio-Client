"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquareOff,
  Phone,
  Star,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlaceNotesPreview } from "../block/items/place-notes";
import { StationOpeningHours } from "../charger/station-opening-hours";
import { getOpeningHoursSchedule } from "../charger/opening-hours";

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
  /** Keep the map visible when this panel is hosted inside the planner. */
  compact?: boolean;
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
  /** A control joined to the add button's right edge, such as a menu of other destinations. */
  addMenu?: ReactNode;
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

function CompactPreviewActions({
  isAdded, usageLabel, targetLabel, insertionLabel, addUnavailableReason,
  showAddAction = true, savedToTrip = false, canAddToTrip = true, total = 1,
  onPrevious, onNext, onAddToTrip, addLabel, addTarget, addMenu,
}: PlacePreviewPanelProps) {
  return <div className="flex shrink-0 items-center gap-2 border-t border-border/70 px-3 py-2.5">
    <DialogTrigger type="button" aria-label="View full place details" className="min-h-8 shrink-0 rounded-sm px-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Details</DialogTrigger>
    {!savedToTrip && total > 1 && <div className="flex shrink-0 gap-1">
      <Button type="button" variant="outline" size="icon-sm" aria-label="Previous place" onClick={onPrevious}><ChevronLeft aria-hidden="true" /></Button>
      <Button type="button" variant="outline" size="icon-sm" aria-label="Next place" onClick={onNext}><ChevronRight aria-hidden="true" /></Button>
    </div>}
    {showAddAction && <>
      <div className="min-w-0 flex-1 text-xs text-muted-foreground">
        {usageLabel && <p role="status" title={usageLabel} className="flex min-w-0 items-center gap-1"><Check className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{usageLabel}</span></p>}
        {targetLabel && canAddToTrip && <p title={`To ${targetLabel}${insertionLabel ? `, ${insertionLabel}` : ""}`} className="truncate">To {targetLabel}{insertionLabel ? ` · ${insertionLabel}` : ""}</p>}
        {!canAddToTrip && <p className="line-clamp-2">{addUnavailableReason ?? "Add a day to your itinerary first"}</p>}
        {addTarget}
      </div>
      <div className="flex shrink-0">
        <Button type="button" size="sm" className={addMenu ? "rounded-l-sm rounded-r-none" : "rounded-sm"} onClick={onAddToTrip} disabled={!canAddToTrip || !onAddToTrip}
          aria-label={targetLabel && onAddToTrip ? `${isAdded ? "Add another visit to" : "Add to"} ${targetLabel}${insertionLabel ? `, ${insertionLabel.toLowerCase()}` : ""}` : undefined}>
          {addLabel ?? (isAdded ? onAddToTrip ? "Add another visit" : "Added" : "Add to trip")}
        </Button>
        {addMenu}
      </div>
    </>}
  </div>;
}

export function PlacePreviewPanel(props: PlacePreviewPanelProps) {
 const {
  compact = false,
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
  addMenu,
 } = props;
  const panelRef = useRef<HTMLElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  useEffect(() => {
    if (!compact) return;
    const map = panelRef.current?.parentElement;
    if (!map) return;
    const measure = () => { if (map.clientHeight > 0) setAvailableHeight(map.clientHeight); };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(map);
    return () => observer.disconnect();
  }, [compact]);
  const shortMap = compact && availableHeight !== null && availableHeight < 500;
  const veryShortMap = compact && availableHeight !== null && availableHeight < 420;
  const schedule = getOpeningHoursSchedule(place.openingHours);
  const hoursSummary = schedule.kind === "text" ? schedule.text
    : schedule.rows.length === 1 ? `${schedule.rows[0].label} · ${schedule.rows[0].hours}` : "View weekly hours";
  const panel = (
    <aside ref={panelRef} aria-label="Place details" className={`absolute bottom-4 left-4 right-4 z-10 max-h-[calc(100%-2rem)] ${compact ? "flex flex-col overflow-hidden" : "overflow-y-auto"} rounded-sm border border-border bg-card text-card-foreground shadow-xl`}>
      {place.imageUrl && !shortMap ? (
        <div className={`relative w-full shrink-0 bg-muted ${compact ? "h-20" : "h-32 sm:h-36"}`}>
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

      <div className={compact ? "min-h-0 overflow-hidden p-3" : "p-4"}>
        <div className={`${compact ? "mb-2" : "mb-3"} flex items-center justify-between gap-3`}>
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

        <div className={compact ? "space-y-2" : "space-y-3"}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 title={place.name} className={`${compact ? "line-clamp-2 text-base" : "text-lg"} font-bold leading-tight text-foreground`}>
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

            {place.description && !compact ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {place.description}
              </p>
            ) : null}
          </div>

          <div className={`grid ${compact ? "gap-1.5 text-xs" : "gap-2 text-sm"} text-muted-foreground`}>
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

            {!veryShortMap && <div className="flex items-start gap-2 py-1">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span title={place.address} className={`min-w-0 break-words leading-relaxed ${compact ? "line-clamp-2" : ""}`}>{place.address}</span>
            </div>}

            {isLoadingDetails ? (
              <p role="status" className="text-xs text-muted-foreground">Loading opening hours…</p>
            ) : compact ? (!veryShortMap && <DialogTrigger type="button" aria-label="View opening hours" className="flex min-h-8 min-w-0 items-center gap-2 rounded-sm text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{hoursSummary}</span>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            </DialogTrigger>) : (
              <StationOpeningHours value={place.openingHours} />
            )}

            {compact ? (!veryShortMap && (place.phone || place.website) ? <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              {!veryShortMap && place.phone && <a href={`tel:${place.phone}`} className="inline-flex min-w-0 items-center gap-1.5 hover:underline"><Phone className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{place.phone}</span></a>}
              {!veryShortMap && place.website && <a href={place.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Website<ExternalLink className="size-3" aria-hidden="true" /></a>}
            </div> : null) : place.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="size-4" aria-hidden="true" />
                <span>{place.phone}</span>
              </div>
            ) : null}

            {place.website && !compact ? (
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

            {place.notes && !compact ? (
              <div className="rounded-sm bg-muted/60 p-3">
                <PlaceNotesPreview value={place.notes} interactive clamped={false} />
              </div>
            ) : null}
          </div>
        </div>

        {!compact && (showAddAction || !savedToTrip) ? <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
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
            <div className="flex">
              <Button
                type="button"
                size="sm"
                className={addMenu ? "rounded-l-sm rounded-r-none" : "rounded-sm"}
                onClick={onAddToTrip}
                disabled={!canAddToTrip || !onAddToTrip}
                aria-label={targetLabel && onAddToTrip ? `${isAdded ? "Add another visit to" : "Add to"} ${targetLabel}${insertionLabel ? `, ${insertionLabel.toLowerCase()}` : ""}` : undefined}
              >
                {addLabel ?? (isAdded ? onAddToTrip ? "Add another visit" : "Added" : "Add to trip")}
              </Button>
              {addMenu}
            </div>
            {targetLabel && canAddToTrip ? <p className="text-right text-xs text-muted-foreground">To {targetLabel}{insertionLabel ? <span className="block">{insertionLabel}</span> : null}</p> : null}
            {!canAddToTrip ? (
              <p className="text-xs text-muted-foreground">
                {addUnavailableReason ?? "Add a day to your itinerary first"}
              </p>
            ) : null}
          </div> : null}
        </div> : null}
      </div>
      {compact && <CompactPreviewActions {...props} />}
    </aside>
  );
  return compact ? <Dialog>
    {panel}
    <DialogContent className="max-h-[85dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>{place.name}</DialogTitle><DialogDescription>Place information and full opening hours.</DialogDescription></DialogHeader>
      {place.description && <p className="text-sm leading-relaxed text-muted-foreground">{place.description}</p>}
      <p className="break-words text-sm text-muted-foreground">{place.address}</p>
      <StationOpeningHours value={place.openingHours} />
      {place.phone && <a href={`tel:${place.phone}`} className="text-sm text-primary hover:underline">{place.phone}</a>}
      {place.website && <a href={place.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Website</a>}
      {place.notes && <PlaceNotesPreview value={place.notes} interactive clamped={false} />}
    </DialogContent>
  </Dialog> : panel;
}
