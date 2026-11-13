"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { renderBanner, type AvatarCrop } from "@/lib/avatar-crop";
import type { TripResponse } from "../../../_components/planner-api";
import { tripMetadataQueryKey } from "../../../_components/trip-metadata-api";
import { removeTripCover, uploadTripCover } from "../../../_components/trip-cover-api";

/**
 * Upload and remove the owner's banner photo for one saved trip. Both write the
 * new cover id into the cached trip so the banner swaps without a refetch.
 */
export function useTripCover(tripId: string | null) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const setCover = (coverMediaId: string | null) => {
    if (!tripId) return;
    queryClient.setQueryData<TripResponse>(tripMetadataQueryKey(tripId), (trip) =>
      trip ? { ...trip, coverMediaId } : trip,
    );
    void queryClient.invalidateQueries({ queryKey: ["planner", "trips"] });
  };

  const upload = useMutation({
    scope: { id: `trip-cover-${tripId ?? "new"}` },
    mutationFn: async ({ bitmap, crop }: { bitmap: ImageBitmap; crop: AvatarCrop }) => {
      if (!tripId) throw new Error("Wait for the trip to finish saving, then try again.");
      setProgress(0);
      return uploadTripCover(tripId, await renderBanner(bitmap, crop), setProgress);
    },
    onSuccess: (cover) => setCover(cover.coverMediaId),
    onError: (error) => console.error("Trip cover upload failed.", { component: "TripHero", operation: "uploadTripCover", tripId, error }),
    onSettled: () => setProgress(null),
  });

  const remove = useMutation({
    scope: { id: `trip-cover-${tripId ?? "new"}` },
    mutationFn: async () => {
      if (!tripId) throw new Error("Wait for the trip to finish saving, then try again.");
      await removeTripCover(tripId);
    },
    onSuccess: () => setCover(null),
    onError: (error) => console.error("Trip cover removal failed.", { component: "TripHero", operation: "removeTripCover", tripId, error }),
  });

  return { upload, remove, progress };
}
