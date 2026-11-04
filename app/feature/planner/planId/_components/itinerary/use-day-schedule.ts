"use client";

import { useMemo } from "react";

import { isPlaceItem, type TripBlockData } from "../constants/types";
import { useTripCharging } from "../garage/use-trip-charging";
import { useTripRoutes } from "../routes/trip-route-query";
import type { RouteSegment } from "../routes/trip-route.types";
import {
  calculateDaySchedule,
  isDayScheduleStale,
  type DaySchedule,
  type DayTimingIssue,
} from "./day-timing";

const NO_SEGMENTS: RouteSegment[] = [];

/** Only routed legs count; a fallback line has no real travel time. */
export function getTravelMinutesByItemId(segments: readonly RouteSegment[], blockId: string): Map<string, number | null> {
  return new Map(segments
    .filter((segment) => segment.blockId === blockId)
    .map((segment) => [
      segment.toItemId,
      segment.status === "routed" && segment.durationSeconds != null ? segment.durationSeconds / 60 : null,
    ]));
}

export type DayScheduleState = {
  schedule: DaySchedule;
  travelMinutesByItemId: ReadonlyMap<string, number | null>;
  /** Undefined with no vehicle to project from, when saved durations are all there is. */
  chargeMinutesByItemId: ReadonlyMap<string, number | null> | undefined;
  /** Travel times are still loading, so a calculation would be missing legs. */
  isWaitingForRoutes: boolean;
  isStale: boolean;
  hasCalculatedTimes: boolean;
  /** Shortfalls before fixed times, shown once the day uses calculated times. */
  lateByItemId: ReadonlyMap<string, Extract<DayTimingIssue, { kind: "late" }>>;
};

export function useDaySchedule(block: TripBlockData, startsFromAnchor: boolean): DayScheduleState {
  const routes = useTripRoutes();
  const segments = routes.data?.segments ?? NO_SEGMENTS;
  const stops = useMemo(() => block.items.filter(isPlaceItem), [block.items]);
  const travelMinutesByItemId = useMemo(() => getTravelMinutesByItemId(segments, block.id), [segments, block.id]);
  const charging = useTripCharging();
  const chargeMinutesByItemId = useMemo(() => {
    const day = charging?.days.get(block.id);
    return day ? new Map([...day.batteryByItemId].map(([id, state]) => [id, state.chargeMinutes])) : undefined;
  }, [charging, block.id]);

  return useMemo(() => {
    const schedule = calculateDaySchedule({ stops, travelMinutesByItemId, chargeMinutesByItemId, startsFromAnchor });
    const hasCalculatedTimes = stops.some((stop) => stop.timeSource === "calculated");
    const lateByItemId = new Map(hasCalculatedTimes
      ? schedule.issues.flatMap((issue) => issue.kind === "late" ? [[issue.itemId, issue] as const] : [])
      : []);
    return {
      schedule,
      travelMinutesByItemId,
      chargeMinutesByItemId,
      isWaitingForRoutes: routes.isFetching && !routes.data,
      isStale: isDayScheduleStale(stops, schedule),
      hasCalculatedTimes,
      lateByItemId,
    };
  }, [stops, travelMinutesByItemId, chargeMinutesByItemId, startsFromAnchor, routes.isFetching, routes.data]);
}
