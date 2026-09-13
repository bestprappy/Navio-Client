import { isEvChargerPlaceItem, isPlaceItem, type PlaceItem, type TripAnchor, type TripAnchorKind, type TripBlockData } from "../constants/types";

export function placeItemToAnchor(item: PlaceItem): TripAnchor {
  return {
    id: item.placeId,
    kind: "PLACE",
    name: item.name,
    address: item.address || undefined,
    lat: item.lat,
    lng: item.lng,
  };
}

/** The stop that may be promoted to the day's end: its last regular place. */
export function getLastDayPlaceId(block: TripBlockData): string | null {
  if (block.kind !== "itinerary") return null;
  const last = block.items.findLast(
    (item) => isPlaceItem(item) && !isEvChargerPlaceItem(item),
  );
  return last?.id ?? null;
}

/** Place badges share their sequence with Start; chargers keep their own icon. */
export function getDayPlacePositions(block: TripBlockData, hasStart: boolean): Map<string, number> {
  const positions = new Map<string, number>();
  let position = block.kind === "itinerary" && hasStart ? 1 : 0;
  for (const item of block.items) {
    if (isPlaceItem(item) && !isEvChargerPlaceItem(item)) positions.set(item.id, ++position);
  }
  return positions;
}

const ANCHOR_KINDS: readonly TripAnchorKind[] = ["SAVED_PLACE", "PLACE", "MANUAL"];

export type ResolvedDayAnchors = {
  start: TripAnchor | null;
  end: TripAnchor | null;
  /** True when the start was inherited rather than chosen on this day. */
  startIsCarriedOver: boolean;
  /**
   * Where the previous day left off, whether or not this day overrides it.
   *
   * Lets the UI name what clearing an override falls back to, instead of
   * offering a vague "use the day before".
   */
  inheritedStart: TripAnchor | null;
};

export const EMPTY_DAY_ANCHORS: ResolvedDayAnchors = {
  start: null,
  end: null,
  startIsCarriedOver: false,
  inheritedStart: null,
};

/**
 * Walks the itinerary in date order and works out where each day begins and
 * ends.
 *
 * A day's start is derived, not stored: you wake up where you went to sleep.
 * Storing both ends per day would let them drift apart the moment a hotel
 * changes, so only explicit choices live in the block and everything else falls
 * through from the day before.
 */
export function resolveDayAnchors(
  blocks: TripBlockData[],
): Map<string, ResolvedDayAnchors> {
  const resolved = new Map<string, ResolvedDayAnchors>();
  let carried: TripAnchor | null = null;

  const days = blocks
    .filter((block) => block.kind === "itinerary")
    .toSorted((a, b) => a.date.localeCompare(b.date));

  for (const day of days) {
    const own: TripAnchor | null = day.startAnchor ?? null;
    const start: TripAnchor | null = own ?? carried;
    const end = day.endAnchor ?? null;
    resolved.set(day.id, {
      start,
      end,
      startIsCarriedOver: !own && Boolean(carried),
      inheritedStart: carried,
    });
    // A day with no stated end leaves you where you started, so the next
    // morning still has somewhere to depart from.
    carried = end ?? start;
  }

  return resolved;
}

/**
 * The day's position in the trip, counting from 1.
 *
 * Days are numbered by their order in the itinerary rather than by date, so a
 * removed day never leaves a gap in the sequence a reader can see.
 */
export function getDayIndex(blocks: TripBlockData[], blockId: string): number {
  const days = blocks
    .filter((block) => block.kind === "itinerary")
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const index = days.findIndex((day) => day.id === blockId);
  return index < 0 ? 0 : index + 1;
}

export function isTripAnchorKind(value: unknown): value is TripAnchorKind {
  return typeof value === "string" && ANCHOR_KINDS.includes(value as TripAnchorKind);
}

export function isTripAnchor(value: unknown): value is TripAnchor {
  if (typeof value !== "object" || value === null) return false;
  const anchor = value as Record<string, unknown>;
  return (
    typeof anchor.id === "string" &&
    anchor.id.length > 0 &&
    isTripAnchorKind(anchor.kind) &&
    typeof anchor.name === "string" &&
    anchor.name.trim().length > 0 &&
    typeof anchor.lat === "number" &&
    Number.isFinite(anchor.lat) &&
    Math.abs(anchor.lat) <= 90 &&
    typeof anchor.lng === "number" &&
    Number.isFinite(anchor.lng) &&
    Math.abs(anchor.lng) <= 180 &&
    (anchor.address === undefined ||
      anchor.address === null ||
      typeof anchor.address === "string")
  );
}

/** True when this anchor must not leave the owner's account. */
export function isPersonalAnchor(anchor: TripAnchor | null | undefined): boolean {
  return anchor?.kind === "SAVED_PLACE";
}
