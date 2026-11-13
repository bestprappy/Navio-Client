"use client";

import { StationOpeningHours } from "../charger/station-opening-hours";
import { usePlaceDetails } from "./use-place-details";

/** Pass the same `includePhoto` as the card around it, so the two share one lookup. */
export function PlaceOpeningHours({ placeId, includePhoto = true }: { placeId: string; includePhoto?: boolean }) {
  const details = usePlaceDetails(placeId, { includePhoto });

  return (
    <div className="border-t border-border/70 px-4 py-3" aria-busy={details.isFetching}>
      {details.isLoading ? (
        <p role="status" className="text-xs text-muted-foreground">Loading opening hours…</p>
      ) : (
        <StationOpeningHours value={details.data?.openingHours} />
      )}
    </div>
  );
}
