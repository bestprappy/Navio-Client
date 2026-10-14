import { atom } from "jotai";

import { isPlaceItem, type PlaceItem } from "../constants/types";
import { plannerReadOnlyAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";
import { calculateDaySchedule, type DayTimingMode, type ReplacedTime } from "./day-timing";
import { withStopTimes } from "./stop-schedule";

type TimeFields = Pick<PlaceItem, "time" | "timeEnd" | "timeSource">;

export type DayTimingUndo = {
  blockId: string;
  entries: { itemId: string; before: TimeFields; after: TimeFields }[];
};

export type ApplyDayTimesResult =
  | { status: "applied"; undo: DayTimingUndo }
  | { status: "unchanged" }
  /** The replacement list moved since it was shown; show the new one before replacing anything. */
  | { status: "preview-changed"; replaced: readonly ReplacedTime[] };

type ApplyDayTimesPayload = {
  blockId: string;
  mode: DayTimingMode;
  travelMinutesByItemId: ReadonlyMap<string, number | null>;
  startsFromAnchor: boolean;
  /** For replace-all: the fixed times the traveller agreed to replace. */
  confirmedReplaced?: readonly ReplacedTime[];
};

function timeFields(item: PlaceItem): TimeFields {
  return { time: item.time, timeEnd: item.timeEnd, timeSource: item.timeSource };
}

function sameTimes(a: TimeFields, b: TimeFields): boolean {
  return a.time === b.time && a.timeEnd === b.timeEnd && (a.timeSource ?? null) === (b.timeSource ?? null);
}

function replacementKey(replaced: readonly ReplacedTime[]): string {
  return JSON.stringify(replaced.map(({ itemId, to }) => [itemId, to.time, to.timeEnd]));
}

/**
 * Calculates from the planner's current state, not from what was on screen when the button
 * was pressed, so an edit made in between is never overwritten by an older calculation.
 */
export const applyDayTimesAtom = atom(null, (get, set, payload: ApplyDayTimesPayload): ApplyDayTimesResult => {
  if (get(plannerReadOnlyAtom)) return { status: "unchanged" };
  const blocks = get(tripBlocksAtom);
  const block = blocks.find((candidate) => candidate.id === payload.blockId);
  if (!block) return { status: "unchanged" };
  const stops = block.items.filter(isPlaceItem);
  const schedule = calculateDaySchedule({
    stops,
    travelMinutesByItemId: payload.travelMinutesByItemId,
    startsFromAnchor: payload.startsFromAnchor,
  }, payload.mode);
  if (payload.mode === "replace-all" && replacementKey(schedule.replaced) !== replacementKey(payload.confirmedReplaced ?? [])) {
    return { status: "preview-changed", replaced: schedule.replaced };
  }

  const entries: DayTimingUndo["entries"] = [];
  const items = block.items.map((item) => {
    const update = isPlaceItem(item) ? schedule.updates.get(item.id) : undefined;
    if (!update || !isPlaceItem(item)) return item;
    const after: TimeFields = { time: update.time, timeEnd: update.timeEnd, timeSource: "calculated" };
    if (sameTimes(timeFields(item), after)) return item;
    entries.push({ itemId: item.id, before: timeFields(item), after });
    return withStopTimes(item, after);
  });
  if (!entries.length) return { status: "unchanged" };
  set(tripBlocksAtom, blocks.map((candidate) => candidate.id === block.id ? { ...candidate, items } : candidate));
  return { status: "applied", undo: { blockId: block.id, entries } };
});

/** A newly added stop waiting for its suggested time. */
export function isAwaitingTime(item: PlaceItem): boolean {
  return item.timeSource === "calculated" && !item.time;
}

/**
 * Gives newly added stops their suggested time. Only stops that have no time at all are
 * touched, so nothing the traveller set, and no existing time, can change behind their back.
 */
export const fillNewStopTimesAtom = atom(null, (get, set, payload: Omit<ApplyDayTimesPayload, "mode" | "confirmedReplaced">): boolean => {
  if (get(plannerReadOnlyAtom)) return false;
  const blocks = get(tripBlocksAtom);
  const block = blocks.find((candidate) => candidate.id === payload.blockId);
  if (!block) return false;
  const stops = block.items.filter(isPlaceItem);
  if (!stops.some(isAwaitingTime)) return false;
  const { updates } = calculateDaySchedule({
    stops,
    travelMinutesByItemId: payload.travelMinutesByItemId,
    startsFromAnchor: payload.startsFromAnchor,
  });
  let filled = false;
  const items = block.items.map((item) => {
    const update = isPlaceItem(item) && isAwaitingTime(item) ? updates.get(item.id) : undefined;
    if (!update) return item;
    filled = true;
    return { ...item, time: update.time, timeEnd: update.timeEnd };
  });
  if (filled) set(tripBlocksAtom, blocks.map((candidate) => candidate.id === block.id ? { ...candidate, items } : candidate));
  return filled;
});

/** Stops changed since the calculation keep their newer values. */
export function canUndoDayTimes(items: readonly PlaceItem[], undo: DayTimingUndo): boolean {
  const byId = new Map(items.map((item) => [item.id, item]));
  return undo.entries.some(({ itemId, after }) => {
    const item = byId.get(itemId);
    return item !== undefined && sameTimes(timeFields(item), after);
  });
}

export const undoDayTimesAtom = atom(null, (get, set, undo: DayTimingUndo): boolean => {
  if (get(plannerReadOnlyAtom)) return false;
  const blocks = get(tripBlocksAtom);
  const restore = new Map(undo.entries.map((entry) => [entry.itemId, entry]));
  let restored = false;
  const next = blocks.map((block) => block.id !== undo.blockId ? block : {
    ...block,
    items: block.items.map((item) => {
      const entry = isPlaceItem(item) ? restore.get(item.id) : undefined;
      if (!entry || !isPlaceItem(item) || !sameTimes(timeFields(item), entry.after)) return item;
      restored = true;
      return withStopTimes(item, entry.before);
    }),
  });
  if (restored) set(tripBlocksAtom, next);
  return restored;
});
