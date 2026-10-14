"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";

import type { TripBlockData } from "../constants/types";
import { useDaySchedule } from "../itinerary/use-day-schedule";
import { refineAutoPlanTimesAtom } from "./auto-plan.atoms";

/**
 * Mounted only while a freshly planned day waits for its routes. The route query is keyed
 * by stop order, so the travel times it waits for belong to the new order, never the old one.
 */
export function AutoPlanTimeRefiner({ block, startsFromAnchor }: { block: TripBlockData; startsFromAnchor: boolean }) {
  const refine = useSetAtom(refineAutoPlanTimesAtom);
  const { travelMinutesByItemId, isWaitingForRoutes } = useDaySchedule(block, startsFromAnchor);

  useEffect(() => {
    if (!isWaitingForRoutes) refine({ blockId: block.id, travelMinutesByItemId, startsFromAnchor });
  }, [isWaitingForRoutes, refine, block.id, travelMinutesByItemId, startsFromAnchor]);

  return null;
}
