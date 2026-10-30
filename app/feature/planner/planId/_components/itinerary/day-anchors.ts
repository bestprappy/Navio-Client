import { isEvChargerPlaceItem, isPlaceItem, type PlaceItem, type TripAnchor, type TripAnchorKind, type TripBlockData, type TripBlockItem } from "../constants/types";

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

/** The stop that may be promoted to the day's start: its first regular place. */
export function getFirstDayPlaceId(block: TripBlockData): string | null {
  if (block.kind !== "itinerary") return null;
  const first = block.items.find(
    (item) => isPlaceItem(item) && !isEvChargerPlaceItem(item),
  );
  return first?.id ?? null;
}

/** About a metre: close enough that two pins are the same doorway. */
const SAME_SPOT_DEGREES = 1e-5;

/** True when a stop is the place an anchor names. */
export function isAnchorPlace(anchor: TripAnchor, item: PlaceItem): boolean {
  if (anchor.kind === "PLACE" && item.placeId && anchor.id === item.placeId) return true;
  return (
    Math.abs(anchor.lat - item.lat) < SAME_SPOT_DEGREES &&
    Math.abs(anchor.lng - item.lng) < SAME_SPOT_DEGREES
  );
}

export type DayEdgeStops = {
  /** The stop the day starts at, when its start is one of its own stops. */
  startStopId: string | null;
  /** The stop the day ends at, when its end is one of its own stops. */
  endStopId: string | null;
};

const NO_EDGE_STOPS: DayEdgeStops = { startStopId: null, endStopId: null };

/**
 * The stops that play the day's start and end role.
 *
 * A start or end chosen on this day that names the day's first or last stop is
 * that stop, not a second visit to it. The stop keeps its time, notes and
 * expenses, and the route does not add a zero-length leg to the same place.
 * Only this day's own choice counts: a start carried over from yesterday's
 * hotel stays a separate place.
 */
export function getDayEdgeStops(block: TripBlockData): DayEdgeStops {
  if (block.kind !== "itinerary") return NO_EDGE_STOPS;
  const places = block.items.filter(isPlaceItem);
  const first = places[0];
  const last = places.at(-1);
  const startStopId =
    block.startAnchor && first && !isEvChargerPlaceItem(first) && isAnchorPlace(block.startAnchor, first)
      ? first.id
      : null;
  const endStopId =
    block.endAnchor && last && last.id !== startStopId && !isEvChargerPlaceItem(last) && isAnchorPlace(block.endAnchor, last)
      ? last.id
      : null;
  return startStopId || endStopId ? { startStopId, endStopId } : NO_EDGE_STOPS;
}

/**
 * Moves a stop to the start or end of the day's route.
 *
 * Only the stop moves; notes and checklists keep their place in the list.
 * Returns the same array when the stop is already there.
 */
export function moveStopToDayEdge(
  items: TripBlockItem[],
  itemId: string,
  edge: "start" | "end",
): TripBlockItem[] {
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) return items;
  const rest = items.filter((item) => item.id !== itemId);
  const target = edge === "start"
    ? rest.findIndex(isPlaceItem)
    : rest.findLastIndex(isPlaceItem) + 1;
  if (target < 0 || (edge === "end" && target === 0)) return items;
  if (target === index) return items;
  return [...rest.slice(0, target), items[index], ...rest.slice(target)];
}

/** The stop a newly chosen start or end names, if the day already visits it. */
export function findDayStopForAnchor(
  block: TripBlockData,
  anchor: TripAnchor,
  edge: "start" | "end",
): string | null {
  if (block.kind !== "itinerary") return null;
  const matches = block.items.filter(
    (item): item is PlaceItem => isPlaceItem(item) && !isEvChargerPlaceItem(item) && isAnchorPlace(anchor, item),
  );
  const match = edge === "start" ? matches[0] : matches.at(-1);
  return match?.id ?? null;
}

/**
 * Keeps each day's start and end stops at the edges of the day.
 *
 * Inserting, dragging or auto-planning can push another stop in front of the
 * start or after the end. Only stops that already held the role are moved
 * back, so a stop never becomes the start or end without the traveller
 * choosing it. Unchanged days keep their identity.
 */
export function keepDayEdgeStopsInPlace(
  previous: readonly TripBlockData[],
  next: TripBlockData[],
): TripBlockData[] {
  const before = new Map(previous.map((block) => [block.id, block]));
  let changed = false;
  const result = next.map((block) => {
    const earlier = before.get(block.id);
    if (block.kind !== "itinerary" || !earlier || earlier === block) return block;
    const held = getDayEdgeStops(earlier);
    if (!held.startStopId && !held.endStopId) return block;
    const now = getDayEdgeStops(block);
    let items = block.items;
    if (held.startStopId && now.startStopId !== held.startStopId && stillNames(block.startAnchor, items, held.startStopId)) {
      items = moveStopToDayEdge(items, held.startStopId, "start");
    }
    if (held.endStopId && now.endStopId !== held.endStopId && stillNames(block.endAnchor, items, held.endStopId)) {
      items = moveStopToDayEdge(items, held.endStopId, "end");
    }
    if (items === block.items) return block;
    changed = true;
    return { ...block, items };
  });
  return changed ? result : next;
}

function stillNames(anchor: TripAnchor | null | undefined, items: TripBlockItem[], itemId: string): boolean {
  const item = items.find((entry) => entry.id === itemId);
  return Boolean(anchor && item && isPlaceItem(item) && !isEvChargerPlaceItem(item) && isAnchorPlace(anchor, item));
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
  /**
   * The start as a separate stop on the route, before the first card.
   *
   * null when the day starts at one of its own stops (`startStopId`); that
   * stop is the start, so routes, numbering and pins use it instead.
   */
  start: TripAnchor | null;
  /** The end as a separate stop on the route; null when `endStopId` is set. */
  end: TripAnchor | null;
  /** Where the day starts, whether a separate place or one of its stops. */
  startPlace: TripAnchor | null;
  /** Where the day ends, whether a separate place or one of its stops. */
  endPlace: TripAnchor | null;
  startStopId: string | null;
  endStopId: string | null;
  /** True when the start was inherited rather than chosen on this day. */
  startIsCarriedOver: boolean;
  endIsCarriedOver: boolean;
  inheritedEnd: TripAnchor | null;
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
  startPlace: null,
  endPlace: null,
  startStopId: null,
  endStopId: null,
  startIsCarriedOver: false,
  endIsCarriedOver: false,
  inheritedEnd: null,
  inheritedStart: null,
};

/**
 * Walks the itinerary in date order and works out where each day begins and
 * ends.
 *
 * Only explicit choices are stored. Each overnight stop becomes the default
 * start and end for following days until another end is chosen. A start-only
 * override never changes the overnight base, including the first day's home.
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
    const startPlace: TripAnchor | null = own ?? carried;
    const endPlace: TripAnchor | null = day.endAnchor ?? carried;
    const { startStopId, endStopId } = getDayEdgeStops(day);
    resolved.set(day.id, {
      start: startStopId ? null : startPlace,
      end: endStopId ? null : endPlace,
      startPlace,
      endPlace,
      startStopId,
      endStopId,
      startIsCarriedOver: !own && Boolean(carried),
      endIsCarriedOver: !day.endAnchor && Boolean(carried),
      inheritedEnd: carried,
      inheritedStart: carried,
    });
    // The next day wakes up here, whether the end is a separate place or a stop.
    carried = endPlace;
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
