import { getTripBlockColorById, type TripBlockColorOption } from "../constants/trip-block-colors";
import {
  isPlaceItem,
  isSectionItem,
  type TripBlockColorId,
  type TripBlockData,
  type TripDestination,
} from "../constants/types";

/**
 * A day can be split into sections. Each section starts at a divider item and
 * runs to the next one; items before the first divider belong to the day itself.
 * Everything here is derived from the item order, so moving a divider moves the
 * stops it covers without any other bookkeeping.
 */

/** The colour each item draws in: its section's colour, or the day's. A divider has its own. */
export function getItemColorIds(block: TripBlockData): Map<string, TripBlockColorId> {
  const colors = new Map<string, TripBlockColorId>();
  let current = block.colorId;
  for (const item of block.items) {
    if (isSectionItem(item)) current = item.colorId ?? block.colorId;
    colors.set(item.id, current);
  }
  return colors;
}

/** The colour the day finishes in, used for its end stop. */
export function getDayEndColorId(block: TripBlockData): TripBlockColorId {
  const last = block.items.findLast(isSectionItem);
  return last ? last.colorId ?? block.colorId : block.colorId;
}

/** The city in effect just before `index`: the latest section city above it, or the day's. */
export function getDestinationAt(
  block: TripBlockData,
  index: number,
  dayDestination: TripDestination,
): TripDestination {
  let current = dayDestination;
  block.items.slice(0, Math.max(0, index)).forEach((item) => {
    if (isSectionItem(item) && item.destination) current = item.destination;
  });
  return current;
}

/** Where the day ends up, which the following days inherit. */
export function getDayFinalDestination(block: TripBlockData, dayDestination: TripDestination): TripDestination {
  return getDestinationAt(block, block.items.length, dayDestination);
}

/** The cities the day passes through in order, such as Kyoto then Osaka. Repeats in a row collapse. */
export function getDayCities(block: TripBlockData, dayDestination: TripDestination): TripDestination[] {
  const cities = [dayDestination];
  for (const item of block.items) {
    if (!isSectionItem(item) || !item.destination) continue;
    if (cities.at(-1)?.id !== item.destination.id) cities.push(item.destination);
  }
  return cities;
}

/** Folded sections, each with the ids of the items it held when it was folded. */
export type CollapsedSections = ReadonlyMap<string, ReadonlySet<string>>;

/** The items a section holds right now, not counting the divider. */
export function getSectionItemIds(block: TripBlockData, sectionId: string): Set<string> {
  const ids = new Set<string>();
  let inside = false;
  for (const item of block.items) {
    if (isSectionItem(item)) {
      if (inside) break;
      inside = item.id === sectionId;
      continue;
    }
    if (inside) ids.add(item.id);
  }
  return ids;
}

/**
 * Items hidden because their section is folded. Only items that were in the
 * section when it was folded hide; one added or moved in later stays in view.
 * Dividers always stay visible.
 */
export function getHiddenItemIds(block: TripBlockData, collapsed: CollapsedSections): Set<string> {
  const hidden = new Set<string>();
  let folded: ReadonlySet<string> | undefined;
  for (const item of block.items) {
    if (isSectionItem(item)) {
      folded = collapsed.get(item.id);
      continue;
    }
    if (folded?.has(item.id)) hidden.add(item.id);
  }
  return hidden;
}

/** The section an item belongs to, or `undefined` before the first divider. */
export function getSectionIdOfItem(block: TripBlockData, itemId: string): string | undefined {
  let sectionId: string | undefined;
  for (const item of block.items) {
    if (isSectionItem(item)) sectionId = item.id;
    if (item.id === itemId) return isSectionItem(item) ? undefined : sectionId;
  }
  return undefined;
}

export type SectionSummary = {
  itemCount: number;
  stopCount: number;
};

/** What each section holds; pass `only` to count just those items, such as the hidden ones. */
export function getSectionSummaries(block: TripBlockData, only?: ReadonlySet<string>): Map<string, SectionSummary> {
  const summaries = new Map<string, SectionSummary>();
  let current: SectionSummary | undefined;
  for (const item of block.items) {
    if (isSectionItem(item)) {
      current = { itemCount: 0, stopCount: 0 };
      summaries.set(item.id, current);
      continue;
    }
    if (!current || (only && !only.has(item.id))) continue;
    current.itemCount += 1;
    if (isPlaceItem(item)) current.stopCount += 1;
  }
  return summaries;
}

/**
 * Map stroke colours keyed by block id, and by stop id where a section changes
 * the colour. The day's end leg is keyed `<blockId>:end`, as the route builder names it.
 */
export function getRouteColorsById(
  blocks: readonly TripBlockData[],
  resolveColor: (colorId: TripBlockColorId) => TripBlockColorOption = getTripBlockColorById,
): Map<string, string> {
  const colors = new Map<string, string>();
  for (const block of blocks) {
    colors.set(block.id, resolveColor(block.colorId).mapColor);
    if (!block.items.some(isSectionItem)) continue;
    getItemColorIds(block).forEach((colorId, itemId) => {
      if (colorId !== block.colorId) colors.set(itemId, resolveColor(colorId).mapColor);
    });
    const endColorId = getDayEndColorId(block);
    if (endColorId !== block.colorId) colors.set(`${block.id}:end`, resolveColor(endColorId).mapColor);
  }
  return colors;
}
