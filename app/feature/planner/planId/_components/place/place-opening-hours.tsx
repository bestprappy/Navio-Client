"use client";

import { StationOpeningHours } from "../charger/station-opening-hours";
import { usePlaceDetails } from "./use-place-details";

export function PlaceOpeningHours({ placeId }: { placeId: string }) {
  const details = usePlaceDetails(placeId);

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
