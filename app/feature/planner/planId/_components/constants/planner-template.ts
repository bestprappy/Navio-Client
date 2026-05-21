import {
  getPlanById,
  getPlanTemplateBlocks,
} from "@/app/feature/explore/_components/data";

import { getTripBlockColorByIndex } from "./trip-block-colors";
import { getPlanTemplatePlaceEvChargerDetails } from "./template-ev";
import type { PlaceItem, TripBlockData } from "./types";

export function getCopiedPlanBlocks(
  planId?: string,
  from?: string,
): TripBlockData[] {
  if (!planId) {
    return [];
  }

  const plan = getPlanById(planId);
  const templateStartDate = plan?.templateStartDate ?? null;

  return getPlanTemplateBlocks(planId).map((block, blockIndex) => {
    const resolvedDate = resolveBlockDate(
      block.date,
      block.type,
      templateStartDate,
      from,
    );
    const isItinerary = block.type === "itinerary";

    return {
      id: `copied-${planId}-${block.id}`,
      kind: isItinerary ? "itinerary" : "list",
      // Itinerary blocks use date as title (matches how the planner stores/displays them).
      // List blocks keep their custom title.
      title: isItinerary ? resolvedDate : block.title,
      date: resolvedDate,
      colorId: getTripBlockColorByIndex(blockIndex),
      items: block.places.map<PlaceItem>((place) => {
        const evCharger = getPlanTemplatePlaceEvChargerDetails(place);

        return {
          id: `copied-${planId}-${block.id}-${place.id}`,
          type: "place",
          placeId: evCharger ? `ev-charger:${place.id}` : place.id,
          name: place.name,
          description: place.description,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating,
          reviewCount: place.reviewCount,
          imageUrl: place.imageUrl,
          time: place.time,
          timeEnd: place.timeEnd,
          notes: place.notes,
          isVisited: false,
          cost: place.cost,
          evCharger,
        };
      }),
    };
  });
}

function resolveBlockDate(
  blockDate: string | undefined,
  blockType: string | undefined,
  templateStartDate: string | null,
  fromDate: string | undefined,
): string {
  if (blockType === "itinerary" && blockDate && templateStartDate && fromDate) {
    const offsetDays = Math.round(
      (new Date(blockDate).getTime() - new Date(templateStartDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const base = new Date(fromDate);
    base.setDate(base.getDate() + offsetDays);
    return base.toISOString().split("T")[0];
  }

  return fromDate ?? getTodayDateValue();
}

function getTodayDateValue(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}
