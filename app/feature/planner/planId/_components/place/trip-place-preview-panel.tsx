"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  activeBlockIdAtom, addPlaceVisitToBlockAtom, plannerReadOnlyAtom, tripBlocksAtom,
  type TripPlaceAnchor,
} from "../overview/trip-builder.atoms";
import { getPlaceUsage } from "../itinerary/trip-location-markers";
import { useRevealPlanCard } from "../itinerary/use-reveal-plan-card";
import { PlacePreviewPanel } from "./place-preview-panel";
import { usePlaceDetails } from "./use-place-details";

type TripPlacePreviewPanelProps = {
  place: TripPlaceAnchor;
  onClose: () => void;
};

export function TripPlacePreviewPanel({ place, onClose }: TripPlacePreviewPanelProps) {
  const details = usePlaceDetails(place.placeId);
  const blocks = useAtomValue(tripBlocksAtom);
  const activeBlockId = useAtomValue(activeBlockIdAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const addVisit = useSetAtom(addPlaceVisitToBlockAtom);
  const reveal = useRevealPlanCard();
  const targetBlockId = blocks.some((block) => block.id === activeBlockId) ? activeBlockId! : place.blockId;
  const usage = getPlaceUsage(blocks, place, targetBlockId);

  return (
    <PlacePreviewPanel
      compact
      place={{
        ...place,
        ...details.data,
        imageUrl: details.data?.imageUrl ?? place.imageUrl,
        description: details.data?.description ?? place.description,
        rating: details.data?.rating ?? place.rating,
        reviewCount: details.data?.reviewCount ?? place.reviewCount,
        primaryType: details.data?.primaryType ?? place.placeType,
        openingHours: place.evCharger?.openingHoursSummary ?? details.data?.openingHours,
        notes: place.notes,
      }}
      isAdded
      usageLabel={usage.label}
      targetLabel={usage.targetLabel}
      showAddAction={!readOnly && !place.isEvCharger}
      canAddToTrip={blocks.some((block) => block.id === targetBlockId)}
      onAddToTrip={() => {
        const itemId = addVisit({ blockId: targetBlockId, place: { ...place, placeType: details.data?.primaryType ?? place.placeType } });
        if (itemId) reveal(targetBlockId, itemId);
      }}
      savedToTrip
      isLoadingDetails={details.isLoading}
      onClose={onClose}
    />
  );
}
