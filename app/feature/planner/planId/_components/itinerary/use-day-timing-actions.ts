"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";

import { isEvChargerPlaceItem, isPlaceItem, type TripBlockData } from "../constants/types";
import { plannerReadOnlyAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";
import { calculateDaySchedule, describeTimingIssue, type ReplacedTime } from "./day-timing";
import {
  applyDayTimesAtom,
  canUndoDayTimes,
  fillNewStopTimesAtom,
  isAwaitingTime,
  undoDayTimesAtom,
  type ApplyDayTimesResult,
  type DayTimingUndo,
} from "./day-timing.atoms";
import { useDaySchedule } from "./use-day-schedule";

type ReplacePreview = { replaced: readonly ReplacedTime[]; changed: boolean };

export type DayTimingStatus =
  | { tone: "loading"; text: string }
  | { tone: "warning"; text: string }
  | { tone: "done"; text: string }
  | { tone: "idle"; text: string };

/**
 * Calculate times keeps every time the traveller set. Replacing those is a separate,
 * deliberate action, and the only one that asks first.
 */
export function useDayTimingActions(block: TripBlockData, startsFromAnchor: boolean) {
  const store = useStore();
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const applyDayTimes = useSetAtom(applyDayTimesAtom);
  const undoDayTimes = useSetAtom(undoDayTimesAtom);
  const { schedule, travelMinutesByItemId, isWaitingForRoutes, isStale, hasCalculatedTimes } = useDaySchedule(block, startsFromAnchor);
  const [undo, setUndo] = useState<DayTimingUndo | null>(null);
  // A message describes the day as it was; any later change to the day retires it.
  const [notice, setNotice] = useState<{ text: string; items: TripBlockData["items"] | null } | null>(null);
  const [preview, setPreview] = useState<ReplacePreview | null>(null);

  const stops = block.items.filter(isPlaceItem);
  const isAvailable = !readOnly && block.kind === "itinerary" && stops.some((stop) => !isEvChargerPlaceItem(stop));
  const canUndo = undo !== null && canUndoDayTimes(stops, undo);
  const needsUpdate = isStale && !canUndo;
  const showNotice = notice !== null && notice.items === block.items;
  const blockingIssue = schedule.issues.find((issue) => issue.kind !== "late");

  // A card just added gets its suggested time as soon as the day can work it out.
  const fillNewStopTimes = useSetAtom(fillNewStopTimesAtom);
  const hasFillableNewStop = !readOnly && stops.some((stop) => isAwaitingTime(stop) && schedule.updates.has(stop.id));
  useEffect(() => {
    if (hasFillableNewStop) fillNewStopTimes({ blockId: block.id, travelMinutesByItemId, startsFromAnchor });
  }, [hasFillableNewStop, fillNewStopTimes, block.id, travelMinutesByItemId, startsFromAnchor]);

  function announce(text: string) {
    // Actions update the store synchronously, so this is the day the message describes.
    const items = store.get(tripBlocksAtom).find((candidate) => candidate.id === block.id)?.items ?? null;
    setNotice({ text, items });
  }

  function handleResult(result: ApplyDayTimesResult) {
    if (result.status === "applied") {
      setUndo(result.undo);
      const count = result.undo.entries.length;
      announce(`${count} ${count === 1 ? "stop time" : "stop times"} updated.`);
    } else if (result.status === "unchanged") {
      setUndo(null);
      announce("Times are already up to date.");
    }
  }

  function calculate() {
    handleResult(applyDayTimes({ blockId: block.id, mode: "keep-fixed", travelMinutesByItemId, startsFromAnchor }));
  }

  /** "review" when edited times would be replaced and the review dialog opens. */
  function recalculateAll(): "review" | "applied" {
    const { replaced } = calculateDaySchedule({ stops, travelMinutesByItemId, startsFromAnchor }, "replace-all");
    // Nothing the traveller set would change, so there is nothing to confirm.
    if (!replaced.length) {
      handleResult(applyDayTimes({ blockId: block.id, mode: "replace-all", travelMinutesByItemId, startsFromAnchor, confirmedReplaced: [] }));
      return "applied";
    }
    setPreview({ replaced, changed: false });
    return "review";
  }

  function confirmRecalculateAll() {
    if (!preview) return;
    const result = applyDayTimes({ blockId: block.id, mode: "replace-all", travelMinutesByItemId, startsFromAnchor, confirmedReplaced: preview.replaced });
    if (result.status === "preview-changed") {
      setPreview({ replaced: result.replaced, changed: true });
      return;
    }
    setPreview(null);
    handleResult(result);
  }

  function undoCalculation() {
    if (undo && undoDayTimes(undo)) announce("Times restored.");
    setUndo(null);
  }

  let status: DayTimingStatus;
  if (isWaitingForRoutes) status = { tone: "loading", text: "Getting travel times…" };
  else if (needsUpdate) status = { tone: "warning", text: "Times need updating" };
  else if (showNotice || canUndo) status = { tone: "done", text: showNotice ? notice.text : "Times calculated." };
  else if (blockingIssue && hasCalculatedTimes) status = { tone: "warning", text: describeTimingIssue(blockingIssue) };
  else status = { tone: "idle", text: "Fixed times stay as they are." };

  return {
    isAvailable,
    isWaitingForRoutes,
    needsUpdate,
    canUndo,
    status,
    calculate,
    recalculateAll,
    undoCalculation,
    replaceDialog: {
      open: preview !== null,
      onOpenChange: (open: boolean) => { if (!open) setPreview(null); },
      replaced: preview?.replaced ?? [],
      changedSinceOpened: preview?.changed ?? false,
      onConfirm: confirmRecalculateAll,
    },
  };
}

export type DayTimingActions = ReturnType<typeof useDayTimingActions>;
