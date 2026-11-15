"use client";
import { ExternalLink, MapPin } from "lucide-react";
import { SaveButton } from "@/app/feature/saved/save-button";
import { AddPlaceToPlan } from "./plan-context";
import { providerBookmark, providerMapsUrl, type ProviderPlace } from "./provider-search-api";

/**
 * A Google Maps search result. No photo area on purpose: Release 2 fetches no provider photos,
 * and a placeholder would suggest one. The Google identity is passed through untouched.
 */
export function ProviderPlaceCard({ place }: { place: ProviderPlace }) {
  const mapsUrl = providerMapsUrl(place);
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-border/70 bg-card p-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.6)] dark:shadow-none">
      <p className="truncate text-xs text-muted-foreground">
        {place.category || "Place"}
      </p>
      <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-6 tracking-tight">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {place.name}
          <span className="sr-only"> (opens Google Maps in a new tab)</span>
        </a>
      </h3>
      <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
        <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        <span className="line-clamp-2">{place.address || "Address not provided"}</span>
      </p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex w-fit items-center gap-1 rounded-sm text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Open in Google Maps
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-3 border-t border-border/50 pt-3">
          <div className="min-w-0 flex-1">
            <AddPlaceToPlan placeId={place.providerPlaceId} />
          </div>
          <SaveButton place={providerBookmark(place)} />
        </div>
      </div>
    </article>
  );
}
