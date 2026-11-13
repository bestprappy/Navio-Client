import { z } from "zod";

import { apiRequest, uploadWithProgress } from "@/lib/api-client";

const tripCoverSchema = z.object({
  tripId: z.string().uuid(),
  coverMediaId: z.string().uuid(),
});

export type TripCover = z.infer<typeof tripCoverSchema>;

const coverPath = (tripId: string) => `/api/trips/${encodeURIComponent(tripId)}/cover`;

/** The owner's uploaded cover, versioned by its id so a replaced photo is refetched. */
export function tripCoverUrl(tripId: string, coverMediaId: string | null | undefined): string | null {
  return coverMediaId ? `${coverPath(tripId)}?v=${encodeURIComponent(coverMediaId)}` : null;
}

export function uploadTripCover(tripId: string, file: File, onProgress: (percent: number) => void): Promise<TripCover> {
  return uploadWithProgress(coverPath(tripId), file, {
    schema: tripCoverSchema,
    operation: "uploadTripCover",
    onProgress,
  });
}

export function removeTripCover(tripId: string): Promise<void> {
  return apiRequest(coverPath(tripId), { method: "DELETE", operation: "removeTripCover" });
}
