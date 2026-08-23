"use client";

import { useQuery } from "@tanstack/react-query";

import type { TripBlockData } from "../../planId/_components/constants/types";
import { isEvChargerPlaceItem, isPlaceItem } from "../../planId/_components/constants/types";
import { getPlannerSnapshot } from "../planner-api";

export type TripPlanStats = {
  blockCount: number;
  placeCount: number;
  chargerCount: number;
  checklistDoneCount: number;
  checklistTotalCount: number;
};

export const EMPTY_TRIP_PLAN_STATS: TripPlanStats = {
  blockCount: 0,
  placeCount: 0,
  chargerCount: 0,
  checklistDoneCount: 0,
  checklistTotalCount: 0,
};

export function tripPlanStatsQueryKey(tripId: string) {
  return ["planner", "snapshot-stats", tripId] as const;
}

/**
 * Loads the saved planner snapshot for one trip and reduces it to the few
 * counters the dashboard shows. Failures resolve to empty stats so a missing
 * snapshot never breaks the dashboard.
 */
export function useTripPlanStats(tripId: string | undefined) {
  return useQuery({
    queryKey: tripPlanStatsQueryKey(tripId ?? "none"),
    enabled: Boolean(tripId),
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<TripPlanStats> => {
      if (!tripId) return EMPTY_TRIP_PLAN_STATS;
      try {
        const snapshot = await getPlannerSnapshot(tripId);
        return summarizeBlocks(snapshot.blocks);
      } catch (error) {
        console.error("Unable to load planner stats for the dashboard.", {
          component: "useTripPlanStats",
          operation: "getPlannerSnapshot",
          tripId,
          error,
        });
        return EMPTY_TRIP_PLAN_STATS;
      }
    },
  });
}

function summarizeBlocks(blocks: readonly TripBlockData[]): TripPlanStats {
  return blocks.reduce<TripPlanStats>((stats, block) => {
    const next = { ...stats, blockCount: stats.blockCount + 1 };

    for (const item of block.items) {
      if (isPlaceItem(item)) {
        next.placeCount += 1;
        if (isEvChargerPlaceItem(item)) next.chargerCount += 1;
        continue;
      }
      if (item.type === "checklist") {
        next.checklistTotalCount += item.items.length;
        next.checklistDoneCount += item.items.filter(
          (subItem) => subItem.checked,
        ).length;
      }
    }

    return next;
  }, EMPTY_TRIP_PLAN_STATS);
}
