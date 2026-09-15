"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tripPlanStatsQueryKey } from "./dashboard/use-trip-plan-stats";
import { deleteTrip, PlannerApiError, type TripPage } from "./planner-api";
import { clearPlannerDraft } from "./planner-draft";
import { recentPlanSidebarAtom, recentPlanSidebarStore } from "./recent-plan-sidebar";
import { tripMetadataQueryKey } from "./trip-metadata-api";

export function useDeleteTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await deleteTrip(tripId);
      } catch (error) {
        // Already gone (another tab, another device): the outcome the user asked for.
        if (error instanceof PlannerApiError && error.status === 404) return;
        throw error;
      }
    },
    // Shares the planner autosave queue, so an in-flight save finishes before the trip is deleted.
    scope: { id: `planner-autosave-${tripId}` },
    onSuccess: () => {
      clearPlannerDraft(tripId);
      recentPlanSidebarStore.set(recentPlanSidebarAtom, (current) =>
        current?.planId === tripId ? null : current,
      );
      queryClient.setQueriesData<TripPage>({ queryKey: ["planner", "trips"] }, (page) =>
        page
          ? {
              content: page.content.filter((trip) => trip.id !== tripId),
              totalElements: Math.max(0, page.totalElements - 1),
            }
          : page,
      );
      void queryClient.invalidateQueries({ queryKey: ["planner", "trips"] });
      // Only inactive entries: refetching an open planner's snapshot would 404, and
      // PlannerPersistence treats a missing trip as one to create again.
      for (const queryKey of [tripMetadataQueryKey(tripId), tripPlanStatsQueryKey(tripId), ["planner", tripId]]) {
        queryClient.removeQueries({ queryKey, exact: true, type: "inactive" });
      }
    },
    onError: (error) => {
      console.error("Trip could not be deleted.", {
        component: "useDeleteTrip",
        operation: "deleteTrip",
        tripId,
        error,
      });
    },
  });
}
