import { atom } from "jotai";

import { isPlaceItem, type TripBlockData, type TripBlockItem } from "../constants/types";
import { calculateDaySchedule } from "../itinerary/day-timing";
import { getDayEdgeStops } from "../itinerary/day-anchors";
import {
  activeSearchAtom,
  openBlockIdsAtom,
  plannerReadOnlyAtom,
  selectedTripPlaceItemIdAtom,
  tripBlocksAtom,
} from "../overview/trip-builder.atoms";
import { arrangeDayItems, type DayAutoPlan } from "./day-auto-plan";

export type AutoPlanUndo = {
  blockId: string;
  /** Items of every day the plan changed, before and after, keyed by day id. */
  before: Record<string, TripBlockItem[]>;
  after: Record<string, TripBlockItem[]>;
  stopCount: number;
  movedCount: number;
  movedTo: string | null;
};

/** The latest Auto plan of each day, while it can still be undone. */
export const autoPlanUndoAtom = atom<Record<string, AutoPlanUndo>>({});

/**
 * Days whose estimated times are replaced by routed travel times once those load,
 * keyed to the exact items they were planned for so a later edit cancels it.
 */
export const autoPlanRefineAtom = atom<Record<string, TripBlockItem[]>>({});

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}

export function canUndoAutoPlan(blocks: readonly TripBlockData[], undo: AutoPlanUndo): boolean {
  return Object.entries(undo.after).every(([blockId, items]) => blocks.find((block) => block.id === blockId)?.items === items);
}

export type ApplyDayAutoPlanPayload = {
  blockId: string;
  /** The items the plan was built from; anything newer means the preview is out of date. */
  sourceItems: readonly TripBlockItem[];
  plan: DayAutoPlan;
  /** Another day for the places that did not fit, or `null` to keep them at the end of this day. */
  moveTo: string | null;
};

export const applyDayAutoPlanAtom = atom(null, (get, set, payload: ApplyDayAutoPlanPayload): boolean => {
  if (get(plannerReadOnlyAtom)) return false;
  const blocks = get(tripBlocksAtom);
  const block = blocks.find((candidate) => candidate.id === payload.blockId);
  if (!block || block.kind !== "itinerary" || block.items !== payload.sourceItems) return false;
  const target = payload.moveTo
    ? blocks.find((candidate) => candidate.id === payload.moveTo && candidate.id !== block.id && candidate.kind === "itinerary")
    : undefined;
  if (payload.moveTo && !target) return false;

  // The day's start and end stops are not planned; they keep the edges of the day.
  const { items, moved } = arrangeDayItems(block.items, payload.plan, !target, getDayEdgeStops(block));
  const targetItems = target ? [...target.items, ...moved] : null;
  set(tripBlocksAtom, blocks.map((candidate) => {
    if (candidate.id === block.id) return { ...candidate, items };
    if (target && targetItems && candidate.id === target.id) return { ...candidate, items: targetItems };
    return candidate;
  }));

  const undo: AutoPlanUndo = {
    blockId: block.id,
    before: { [block.id]: block.items, ...(target ? { [target.id]: target.items } : {}) },
    after: { [block.id]: items, ...(target && targetItems ? { [target.id]: targetItems } : {}) },
    stopCount: payload.plan.stops.length,
    movedCount: moved.filter(isPlaceItem).length,
    movedTo: target?.id ?? null,
  };
  set(autoPlanUndoAtom, (current) => ({ ...current, [block.id]: undo }));
  set(autoPlanRefineAtom, (current) => ({ ...current, [block.id]: items }));
  set(openBlockIdsAtom, (ids) => ids.includes(block.id) ? ids : [...ids, block.id]);
  set(activeSearchAtom, null);
  set(selectedTripPlaceItemIdAtom, null);
  return true;
});

export const undoDayAutoPlanAtom = atom(null, (get, set, blockId: string): boolean => {
  const undo = get(autoPlanUndoAtom)[blockId];
  set(autoPlanUndoAtom, (current) => without(current, blockId));
  set(autoPlanRefineAtom, (current) => without(current, blockId));
  const blocks = get(tripBlocksAtom);
  if (!undo || get(plannerReadOnlyAtom) || !canUndoAutoPlan(blocks, undo)) return false;
  set(tripBlocksAtom, blocks.map((block) => undo.before[block.id] ? { ...block, items: undo.before[block.id] } : block));
  return true;
});

export const dismissDayAutoPlanAtom = atom(null, (_get, set, blockId: string) => {
  set(autoPlanUndoAtom, (current) => without(current, blockId));
});

/**
 * Swaps the plan's distance estimates for routed travel times. Only times Auto plan
 * calculated move; pinned meal, opening and start times stay, as does anything the
 * traveller set. Legs without a routed time keep their estimate.
 */
export const refineAutoPlanTimesAtom = atom(null, (get, set, payload: {
  blockId: string;
  travelMinutesByItemId: ReadonlyMap<string, number | null>;
  startsFromAnchor: boolean;
}): boolean => {
  const pending = get(autoPlanRefineAtom)[payload.blockId];
  set(autoPlanRefineAtom, (current) => without(current, payload.blockId));
  const blocks = get(tripBlocksAtom);
  const block = blocks.find((candidate) => candidate.id === payload.blockId);
  if (!block || !pending || block.items !== pending || get(plannerReadOnlyAtom)) return false;

  const { updates } = calculateDaySchedule({
    stops: block.items.filter(isPlaceItem),
    travelMinutesByItemId: payload.travelMinutesByItemId,
    startsFromAnchor: payload.startsFromAnchor,
  });
  let changed = false;
  const items = block.items.map((item) => {
    const update = isPlaceItem(item) && item.timeSource === "calculated" ? updates.get(item.id) : undefined;
    if (!update || !isPlaceItem(item) || (update.time === item.time && update.timeEnd === item.timeEnd)) return item;
    changed = true;
    return { ...item, ...update };
  });
  if (!changed) return false;
  set(tripBlocksAtom, blocks.map((candidate) => candidate.id === block.id ? { ...candidate, items } : candidate));
  // The refinement is part of the plan, so Undo still restores the day as it was before.
  const undo = get(autoPlanUndoAtom)[block.id];
  if (undo?.after[block.id] === pending) {
    set(autoPlanUndoAtom, (current) => ({ ...current, [block.id]: { ...undo, after: { ...undo.after, [block.id]: items } } }));
  }
  return true;
});
