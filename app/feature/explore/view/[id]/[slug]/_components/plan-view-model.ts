import type {
  Plan,
  PlanTemplatePlace,
} from "../../../../_components/data";
import { getPlanTemplateBlocks } from "../../../../_components/data";
import { getTripBlockColorByIndex } from "@/app/feature/planner/planId/_components/constants/trip-block-colors";
import { getPlanTemplatePlaceEvChargerDetails } from "@/app/feature/planner/planId/_components/constants/template-ev";
import type {
  PlaceItem,
  TripBlockColorId,
  TripBlockData,
} from "@/app/feature/planner/planId/_components/constants/types";

export type ExplorePlanPlace = PlanTemplatePlace & {
  blockId: string;
  blockTitle: string;
  colorId: TripBlockColorId;
  displayId: string;
  position: number | null;
};

export type ExplorePlanBlock = {
  id: string;
  title: string;
  type?: "itinerary" | "list";
  date?: string;
  colorId: TripBlockColorId;
  places: ExplorePlanPlace[];
};

export function getExplorePlaceDisplayId(
  blockId: string,
  placeId: string,
): string {
  return `${blockId}:${placeId}`;
}

export function getExplorePlanBlocks(plan?: Plan): ExplorePlanBlock[] {
  if (!plan) {
    return [];
  }

  return getPlanTemplateBlocks(plan.id).map((block, blockIndex) => {
    const colorId = getTripBlockColorByIndex(blockIndex);

    let regularPosition = 0;

    return {
      id: block.id,
      title: block.title,
      type: block.type,
      date: block.date,
      colorId,
      places: block.places.map((place) => {
        if (!place.isEvCharger) {
          regularPosition += 1;
        }

        return {
          ...place,
          blockId: block.id,
          blockTitle: block.title,
          colorId,
          displayId: getExplorePlaceDisplayId(block.id, place.id),
          position: place.isEvCharger ? null : regularPosition,
        };
      }),
    };
  });
}

export function getExplorePlanTripBlocks(plan?: Plan): TripBlockData[] {
  if (!plan) {
    return [];
  }

  return getPlanTemplateBlocks(plan.id).map((block, blockIndex) => {
    const colorId = getTripBlockColorByIndex(blockIndex);
    const isItinerary = block.type !== "list";

    return {
      id: block.id,
      kind: isItinerary ? "itinerary" : "list",
      title: isItinerary ? (block.date ?? block.title) : block.title,
      date: block.date ?? plan.templateStartDate ?? "",
      colorId,
      items: block.places.map<PlaceItem>((place) => {
        const evCharger = getPlanTemplatePlaceEvChargerDetails(place);

        return {
          id: getExplorePlaceDisplayId(block.id, place.id),
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
          notes: place.notes,
          isVisited: place.isVisited,
          time: place.time,
          timeEnd: place.timeEnd,
          cost: place.cost,
          evCharger,
        };
      }),
    };
  });
}

export function getExplorePlanPlaces(plan?: Plan): ExplorePlanPlace[] {
  return getExplorePlanBlocks(plan).flatMap((block) => block.places);
}

export function formatReviewCount(count: number): string {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: count >= 10_000 ? "compact" : "standard",
  }).format(count);
}
