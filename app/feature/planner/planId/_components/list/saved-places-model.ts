import {
  isPlaceItem,
  isEvChargerPlaceItem,
  type PlaceItem,
  type TripBlockData,
} from "../constants/types";

export function savedPlaceKey(place: Pick<PlaceItem, "placeId">) {
  return place.placeId.replace(/^GOOGLE:/, "");
}

/** Presentation only: saved places live in their original blocks but appear once in Places. */
export function visibleMyListBlocks(blocks: TripBlockData[]) {
  return blocks.map((block) => {
    const items = block.items.filter(
      (item) => !isPlaceItem(item) || isEvChargerPlaceItem(item),
    );
    // Keep list management available even when all its places are shown in the subsection.
    return { ...block, items };
  });
}

export function collectListPlaces(blocks: TripBlockData[]) {
  const places = new Map<
    string,
    { place: PlaceItem; listId: string; listTitle: string }
  >();
  for (const block of blocks.filter((block) => block.kind === "list")) {
    for (const place of block.items.filter(isPlaceItem)) {
      if (isEvChargerPlaceItem(place) || places.has(savedPlaceKey(place)))
        continue;
      places.set(savedPlaceKey(place), {
        place,
        listId: block.id,
        listTitle: block.title || "My List",
      });
    }
  }
  return [...places.values()];
}

export function itineraryDays(blocks: TripBlockData[]) {
  return blocks
    .filter((block) => block.kind === "itinerary")
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map((block, index) => ({ ...block, label: `Day ${index + 1}` }));
}

export function scheduledDays(blocks: TripBlockData[], place: PlaceItem) {
  return itineraryDays(blocks).filter((day) =>
    day.items.some(
      (item) =>
        isPlaceItem(item) && savedPlaceKey(item) === savedPlaceKey(place),
    ),
  );
}

export function canSchedulePlace(
  blocks: TripBlockData[],
  place: PlaceItem,
  dayId: string,
) {
  return (
    blocks.some((block) => block.id === dayId && block.kind === "itinerary") &&
    !scheduledDays(blocks, place).some((day) => day.id === dayId)
  );
}
