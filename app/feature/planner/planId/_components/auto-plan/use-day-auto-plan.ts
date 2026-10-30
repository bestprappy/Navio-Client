"use client";

import { useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { isPlaceItem, type TripBlockData } from "../constants/types";
import { formatGuideDayLabel } from "../guide/guide-dom";
import { EMPTY_DAY_ANCHORS, getDayIndex, resolveDayAnchors } from "../itinerary/day-anchors";
import { DEFAULT_DAY_START_MINUTE, formatClockMinute, isFixedTime, parseClockMinute } from "../itinerary/day-timing";
import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { applyDayAutoPlanAtom } from "./auto-plan.atoms";
import { buildDayAutoPlan, classifyDayPlaces, defaultAutoPlanMode, type AutoPlanMode, type DayAutoPlan } from "./day-auto-plan";
import { weekdayOf } from "./opening-hours";
import { useDayPlaceDetails } from "./use-day-place-details";

export const KEEP_ON_THIS_DAY = "keep";
const MIN_DAY_MINUTES = 60;

export type DayOption = { value: string; label: string };

/** Everything the Auto plan dialog shows for one day, rebuilt as the settings change. */
export function useDayAutoPlan(block: TripBlockData) {
  const blocks = useAtomValue(tripBlocksAtom);
  const applyPlan = useSetAtom(applyDayAutoPlanAtom);
  const [start, setStart] = useState(() => formatClockMinute(DEFAULT_DAY_START_MINUTE));
  const [end, setEnd] = useState("21:00");
  const [mode, setMode] = useState<AutoPlanMode>(() => defaultAutoPlanMode(block.items));
  const [keepSetTimes, setKeepSetTimes] = useState(true);
  const [moveTo, setMoveTo] = useState<string>(KEEP_ON_THIS_DAY);
  const [applyError, setApplyError] = useState<string | null>(null);
  const placeDetails = useDayPlaceDetails(block.items);

  const resolved = useMemo(() => resolveDayAnchors(blocks).get(block.id) ?? EMPTY_DAY_ANCHORS, [blocks, block.id]);
  // A start or end stop stays where it is; the plan orders the stops between them.
  const anchors = useMemo(() => ({
    ...resolved,
    start: resolved.start ?? (resolved.startStopId ? resolved.startPlace : null),
    end: resolved.end ?? (resolved.endStopId ? resolved.endPlace : null),
  }), [resolved]);
  const planItems = useMemo(() => block.items.filter((item) => item.id !== resolved.startStopId && item.id !== resolved.endStopId), [block.items, resolved.startStopId, resolved.endStopId]);
  const dayNumber = getDayIndex(blocks, block.id);
  const otherDays = useMemo<DayOption[]>(() => blocks
    .filter((candidate) => candidate.kind === "itinerary" && candidate.id !== block.id)
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map((candidate) => ({ value: candidate.id, label: `Day ${getDayIndex(blocks, candidate.id)}, ${formatGuideDayLabel(candidate.date)}` })), [blocks, block.id]);

  const startMinute = parseClockMinute(start);
  const endMinute = parseClockMinute(end);
  const settingsError = startMinute === null || endMinute === null
    ? "Enter a start and finish time."
    : endMinute - startMinute < MIN_DAY_MINUTES ? "Finish at least an hour after you start." : null;

  const classified = useMemo(() => classifyDayPlaces(planItems, placeDetails.details, block.date), [planItems, placeDetails.details, block.date]);
  const setTimeCount = classified.plan.filter((stop) => isFixedTime(stop.item)).length;
  const canPlan = classified.plan.length >= 2;

  const plan = useMemo<DayAutoPlan | null>(() => {
    if (!canPlan || placeDetails.isLoading || settingsError || startMinute === null || endMinute === null) return null;
    try {
      return buildDayAutoPlan({
        items: planItems,
        date: block.date,
        details: placeDetails.details,
        start: anchors.start,
        end: anchors.end,
        settings: { startMinute, endMinute, mode, keepSetTimes },
      });
    } catch (error) {
      console.error("[AutoPlan] Could not build a plan", { blockId: block.id, error });
      return null;
    }
  }, [canPlan, placeDetails.isLoading, placeDetails.details, settingsError, startMinute, endMinute, mode, keepSetTimes, planItems, block.date, block.id, anchors.start, anchors.end]);

  const hoursUnknown = plan?.stops.filter((stop) => stop.hours === null).map((stop) => stop.name) ?? [];
  const validMoveTo = moveTo === KEEP_ON_THIS_DAY || otherDays.some((day) => day.value === moveTo) ? moveTo : KEEP_ON_THIS_DAY;

  function apply(): boolean {
    if (!plan) return false;
    const applied = applyPlan({
      blockId: block.id,
      sourceItems: block.items,
      plan,
      moveTo: plan.unplanned.length && validMoveTo !== KEEP_ON_THIS_DAY ? validMoveTo : null,
    });
    setApplyError(applied ? null : "This day changed while the plan was open. Check the updated plan and apply again.");
    return applied;
  }

  return {
    block,
    dayNumber,
    weekday: weekdayOf(block.date),
    anchors,
    placeCount: block.items.filter(isPlaceItem).length,
    canPlan,
    isLoading: placeDetails.isLoading,
    hoursUnknown,
    plan,
    settings: { start, end, mode, keepSetTimes, setTimeCount, error: settingsError },
    setStart,
    setEnd,
    setMode,
    setKeepSetTimes,
    otherDays,
    moveTo: validMoveTo,
    setMoveTo,
    applyError,
    apply,
  };
}

export type DayAutoPlanState = ReturnType<typeof useDayAutoPlan>;
