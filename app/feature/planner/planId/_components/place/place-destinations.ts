import {
  isPlaceItem,
  type TripBlockColorId,
  type TripBlockData,
  type TripBlockKind,
} from "../constants/types";
import { samePlace } from "../itinerary/trip-location-markers";

export type PlaceDestination = {
  blockId: string;
  kind: TripBlockKind;
  label: string;
  /** A day's date, such as "Sat 31 Oct". */
  detail?: string;
  colorId: TripBlockColorId;
  /** Every given place is already a stop here, so adding would only duplicate it. */
  contains: boolean;
};

type DestinationPlace = { placeId: string; name: string; lat: number; lng: number };

function formatDayDate(date: string): string | undefined {
  const value = new Date(`${date}T00:00:00`);
  return Number.isNaN(value.getTime())
    ? undefined
    : value.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function containsAll(block: TripBlockData, places: readonly DestinationPlace[]): boolean {
  return places.length > 0 && places.every((place) =>
    block.items.some((item) => isPlaceItem(item) && samePlace(item, place)));
}

/** Itinerary days in date order, each marked when it already holds every given place. */
export function getDayDestinations(blocks: TripBlockData[], places: readonly DestinationPlace[]): PlaceDestination[] {
  return blocks
    .filter((block) => block.kind === "itinerary")
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map((block, index) => ({
      blockId: block.id, kind: block.kind, label: `Day ${index + 1}`, detail: formatDayDate(block.date),
      colorId: block.colorId, contains: containsAll(block, places),
    }));
}

/** Every list and day a place can be added to, in the order the planner shows them. */
export function getPlaceDestinations(blocks: TripBlockData[], place: DestinationPlace) {
  const lists = blocks
    // Starting Part is trip notes, not somewhere a place is saved.
    .filter((block) => block.kind === "list" && !block.id.startsWith("starting-part-"))
    .map<PlaceDestination>((block) => ({
      blockId: block.id, kind: block.kind, label: block.title.trim() || "Untitled list",
      colorId: block.colorId, contains: containsAll(block, [place]),
    }));
  return { lists, days: getDayDestinations(blocks, [place]) };
}
