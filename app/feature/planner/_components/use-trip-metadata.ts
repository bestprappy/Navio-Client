"use client";

import { useSetAtom } from "jotai";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getPlannerSnapshot, isPersistedTripId } from "./planner-api";
import {
  getTripMetadata,
  tripMetadataQueryKey,
  updateTripMetadata,
  type TripMetadataUpdate,
} from "./trip-metadata-api";
import { tripMetadataPlannerVersionAtom } from "./trip-metadata-sync.atoms";
import { readPlannerDraft, writePlannerDraft } from "./planner-draft";

export function useTripMetadata(planId?: string) {
  const tripId = isPersistedTripId(planId) ? planId : null;
  return useQuery({
    queryKey: tripMetadataQueryKey(tripId ?? "new"),
    queryFn: () => getTripMetadata(tripId!),
    enabled: tripId !== null,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateTripMetadata(planId?: string) {
  const tripId = isPersistedTripId(planId) ? planId : null;
  const queryClient = useQueryClient();
  const setMetadataVersion = useSetAtom(tripMetadataPlannerVersionAtom);

  return useMutation({
    mutationFn: async (update: TripMetadataUpdate) => {
      if (!tripId) throw new Error("Wait for the trip to finish loading.");
      const trip = await updateTripMetadata(tripId, update);
      setMetadataVersion({ tripId, version: null });
      try {
        const snapshot = await getPlannerSnapshot(tripId);
        const draft = readPlannerDraft(tripId);
        if (draft && snapshot.version === draft.version + 1) writePlannerDraft(tripId, snapshot.version, draft);
        queryClient.setQueryData(["planner", tripId], snapshot);
        setMetadataVersion({ tripId, version: snapshot.version });
      } catch (error) {
        // The metadata was saved. The next planner save retries the version read.
        console.warn("Trip metadata saved; planner version refresh will be retried.", {
          component: "useUpdateTripMetadata",
          tripId,
          error,
        });
      }
      return trip;
    },
    scope: { id: tripId ? `planner-autosave-${tripId}` : "planner-autosave" },
    onSuccess: (trip) => {
      queryClient.setQueryData(tripMetadataQueryKey(trip.id), trip);
      void queryClient.invalidateQueries({ queryKey: ["planner", "trips"] });
    },
    onError: (error) => {
      console.error("Trip details could not be saved.", {
        component: "useUpdateTripMetadata",
        operation: "updateTripMetadata",
        tripId,
        error,
      });
    },
  });
}
