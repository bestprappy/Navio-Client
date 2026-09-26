"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getPlannerSnapshot, PlannerApiError } from "../planner-api";
import { flushPlannerAutosave } from "../planner-autosave-flush";
import { EXPLORE_SHARED_PLANS_QUERY_KEY } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";

import {
  getPublication,
  previewPublication,
  publishPlan,
  setExploreListing,
  stopSharingPlan,
  type Publication,
  type PublicationOptions,
} from "./publication-api";

export function publicationQueryKey(tripId: string) {
  return ["planner", tripId, "publication"] as const;
}

export function publicationPreviewQueryKey(tripId: string, options: PublicationOptions) {
  return ["planner", tripId, "publication", "preview", options] as const;
}

/** The owner's current link state. Only fetched while the dialog is open. */
export function usePublication(tripId: string, enabled: boolean) {
  return useQuery({
    queryKey: publicationQueryKey(tripId),
    queryFn: () => getPublication(tripId),
    enabled,
    // The link is a security-relevant fact: a revocation made in another tab
    // should not be masked by a cached "published" answer.
    staleTime: 0,
    gcTime: 0,
    retry: (failureCount, error) =>
      failureCount < 2 && !(error instanceof PlannerApiError && error.status === 404),
  });
}

/**
 * The exact snapshot publishing would freeze.
 *
 * <p>Keyed by the options, so changing a checkbox refetches rather than showing
 * the owner a preview of settings they have moved on from.
 */
export function usePublicationPreview(
  tripId: string,
  options: PublicationOptions,
  enabled: boolean,
) {
  return useQuery({
    queryKey: publicationPreviewQueryKey(tripId, options),
    queryFn: () => previewPublication(tripId, options),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Saves anything outstanding, then publishes that exact version.
 *
 * <p>No mutation scope: the flush calls the autosave mutation, which owns
 * `planner-autosave-<tripId>`. Taking that scope here would make this mutation
 * wait for a save that is waiting for this mutation.
 */
export function usePublishPlan(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      options,
      expectedRevision,
      listInExplore,
      authorDisplayName,
    }: {
      options: PublicationOptions;
      expectedRevision: number | null;
      listInExplore: boolean;
      authorDisplayName: string | null;
    }): Promise<Publication> => {
      // Null means no planner is mounted for this trip (the dashboard entry
      // point), so nothing local can be pending and the server's version is
      // authoritative.
      const flushedVersion = await flushPlannerAutosave(tripId);
      const expectedTripVersion =
        flushedVersion ?? (await getPlannerSnapshot(tripId)).version;

      return publishPlan(tripId, {
        expectedTripVersion,
        expectedRevision,
        options,
        listInExplore,
        authorDisplayName,
      });
    },
    onSuccess: (publication) => {
      queryClient.setQueryData(publicationQueryKey(tripId), publication);
      void queryClient.invalidateQueries({ queryKey: EXPLORE_SHARED_PLANS_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Plan could not be published.", {
        component: "usePublishPlan",
        operation: "publishPlan",
        tripId,
        status: error instanceof PlannerApiError ? error.status : undefined,
      });
    },
  });
}

/** Lists or unlists on Explore right away, without touching the published content. */
export function useUpdateExploreListing(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listedInExplore,
      authorDisplayName,
    }: {
      listedInExplore: boolean;
      authorDisplayName: string | null;
    }) => setExploreListing(tripId, listedInExplore, authorDisplayName),
    onSuccess: (publication) => {
      queryClient.setQueryData(publicationQueryKey(tripId), publication);
      void queryClient.invalidateQueries({ queryKey: EXPLORE_SHARED_PLANS_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Explore listing could not be changed.", {
        component: "useUpdateExploreListing",
        operation: "setExploreListing",
        tripId,
        status: error instanceof PlannerApiError ? error.status : undefined,
      });
    },
  });
}

export function useStopSharing(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stopSharingPlan(tripId),
    onSuccess: () => {
      queryClient.setQueryData<Publication>(publicationQueryKey(tripId), { published: false });
      void queryClient.invalidateQueries({ queryKey: EXPLORE_SHARED_PLANS_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Sharing could not be stopped.", {
        component: "useStopSharing",
        operation: "stopSharingPlan",
        tripId,
        status: error instanceof PlannerApiError ? error.status : undefined,
      });
    },
  });
}
