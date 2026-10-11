import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type PlaceItem,
  type TripAnchor,
  type TripBlockColorId,
  type TripBlockData,
} from "../constants/types";
import { getDayPlacePositions, resolveDayAnchors } from "./day-anchors";

export type TripLocationVisit = {
  key: string;
  blockId: string;
  blockLabel: string;
  colorId: TripBlockColorId;
  edge: "start" | "stop" | "end";
  number: number | null;
  name: string;
  itemId?: string;
  time?: string;
  anchor?: TripAnchor;
  isEvCharger: boolean;
};

export type TripLocationMarker = {
  key: string;
  lat: number;
  lng: number;
  visits: TripLocationVisit[];
};

type Location = { lat: number; lng: number; name: string; placeId?: string };

// Same precision as the existing overnight pins: about one metre.
function coordinateKey(location: Pick<Location, "lat" | "lng">): string {
  return `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
}

function placeKey(id: string): string {
  // Legacy Google stops and day anchors keep the raw provider ID.
  return id.startsWith("GOOGLE:") ? id.slice(7) : id;
}

function samePlace(a: Location, b: Location): boolean {
  if (a.placeId && b.placeId && placeKey(a.placeId) === placeKey(b.placeId)) return true;
  return coordinateKey(a) === coordinateKey(b) && a.name.trim().toLocaleLowerCase() === b.name.trim().toLocaleLowerCase();
}

export function getTripBlockLabels(blocks: TripBlockData[]): Map<string, string> {
  const labels = new Map<string, string>();
  blocks.filter((block) => block.kind === "itinerary")
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .forEach((block, index) => labels.set(block.id, `Day ${index + 1}`));
  blocks.filter((block) => block.kind === "list")
    .forEach((block) => labels.set(block.id, block.title || "List"));
  return labels;
}

/** Map grouping is presentation only; every occurrence remains in the route. */
export function buildTripLocationMarkers(blocks: TripBlockData[]): TripLocationMarker[] {
  const anchors = resolveDayAnchors(blocks);
  const labels = getTripBlockLabels(blocks);
  const byCoordinate = new Map<string, TripLocationMarker>();
  const byPlace = new Map<string, TripLocationMarker>();

  function add(location: Location, visit: TripLocationVisit) {
    const coordinates = coordinateKey(location);
    const identity = location.placeId ? placeKey(location.placeId) : undefined;
    const coordinateGroup = byCoordinate.get(coordinates);
    const identityGroup = identity ? byPlace.get(identity) : undefined;
    const marker = identityGroup ?? coordinateGroup ?? {
      key: coordinates, lat: location.lat, lng: location.lng, visits: [],
    };
    // An ID and a coordinate can connect two previously separate groups.
    if (identityGroup && coordinateGroup && identityGroup !== coordinateGroup) {
      marker.visits.push(...coordinateGroup.visits);
      for (const [key, group] of byCoordinate) if (group === coordinateGroup) byCoordinate.set(key, marker);
      for (const [key, group] of byPlace) if (group === coordinateGroup) byPlace.set(key, marker);
    }
    marker.visits.push(visit);
    byCoordinate.set(coordinates, marker);
    if (identity) byPlace.set(identity, marker);
  }

  for (const block of blocks.toSorted((a, b) => a.date.localeCompare(b.date))) {
    const day = anchors.get(block.id);
    const positions = getDayPlacePositions(block, Boolean(day?.start));
    const base = { blockId: block.id, blockLabel: labels.get(block.id)!, colorId: block.colorId };
    function addAnchor(edge: "start" | "end", anchor: TripAnchor, number: number) {
      add({ ...anchor, placeId: anchor.kind === "PLACE" ? anchor.id : undefined }, {
        ...base, key: `${block.id}:${edge}`, edge, number, name: anchor.name, anchor, isEvCharger: false,
      });
    }
    if (day?.start) addAnchor("start", day.start, 1);
    for (const item of block.items.filter(isPlaceItem)) {
      add(item, {
        ...base, key: `${block.id}:${item.id}`, edge: "stop", number: positions.get(item.id) ?? null,
        name: item.name, itemId: item.id, time: item.time, isEvCharger: isEvChargerPlaceItem(item),
      });
    }
    if (day?.end) addAnchor("end", day.end, positions.size + (day.start ? 2 : 1));
  }
  return Array.from(new Set(byCoordinate.values()));
}

export function orderVisitsForActiveBlock(
  visits: readonly TripLocationVisit[], activeBlockId: string | null, selectedItemId?: string,
): TripLocationVisit[] {
  return visits.toSorted((a, b) => {
    const priority = (visit: TripLocationVisit) => visit.itemId === selectedItemId && selectedItemId ? 0 : visit.blockId === activeBlockId ? 1 : 2;
    return priority(a) - priority(b);
  });
}

/** Includes day boundaries, including inherited hotel starts and ends. */
export function getPlaceUsage(blocks: TripBlockData[], location: Location, targetBlockId?: string) {
  const anchors = resolveDayAnchors(blocks);
  const labels = getTripBlockLabels(blocks);
  const usages = blocks.flatMap((block) => {
    const day = anchors.get(block.id);
    const count = block.items.filter((item) => isPlaceItem(item) && samePlace(item, location)).length
      + ([day?.start, day?.end].filter((anchor) => anchor && samePlace({
        ...anchor, placeId: anchor.kind === "PLACE" ? anchor.id : undefined,
      }, location)).length);
    return count ? [{ blockId: block.id, label: labels.get(block.id)!, count }] : [];
  });
  const target = usages.find((usage) => usage.blockId === targetBlockId);
  const label = target
    ? `Already in ${target.label}${target.count > 1 ? ` · ${target.count} visits` : ""}`
    : usages.length ? `Already in ${usages.map((usage) => usage.label).join(", ")}` : undefined;
  return { isAdded: usages.length > 0, label, targetLabel: targetBlockId ? labels.get(targetBlockId) : undefined };
}

/** Copies the place, keeping visit-specific money, progress and notes fresh. */
export function createPlaceVisit(source: Pick<PlaceItem,
  "placeId" | "name" | "address" | "lat" | "lng" | "description" | "rating" | "reviewCount" | "imageUrl" | "placeType"
>, id: string): PlaceItem {
  return {
    id, type: "place", placeId: source.placeId, name: source.name, address: source.address,
    lat: source.lat, lng: source.lng, description: source.description, rating: source.rating,
    reviewCount: source.reviewCount, imageUrl: source.imageUrl, placeType: source.placeType, isVisited: false,
  };
}
