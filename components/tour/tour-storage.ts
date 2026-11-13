import { z } from "zod";

import { TOUR_IDS, type TourId, type TourRecord, type TourRecords, type TourStatus } from "./tour.types";

/**
 * Remembers which first-time tours this browser has already shown, per account.
 * Only tour ids, statuses and timestamps are stored, never trip content.
 * Every access is guarded: private windows and blocked storage throw, and a
 * corrupt value must read as "not seen" instead of breaking the page.
 */
const STORAGE_PREFIX = "navio:tours:v1";

const tourRecordSchema = z.object({
  status: z.enum(["completed", "dismissed"]),
  version: z.number().int().nonnegative(),
  at: z.string(),
});

const tourRecordsSchema = z.partialRecord(z.enum(TOUR_IDS), tourRecordSchema);

/** The subset of the Web Storage API this module needs, so tests can pass a fake. */
export type TourStorage = Pick<Storage, "getItem" | "setItem">;

export function tourStorageKey(userId: string | null | undefined): string {
  const owner = userId?.trim();
  return `${STORAGE_PREFIX}:${owner ? owner : "guest"}`;
}

export function readTourRecords(storage: TourStorage | null, userId: string | null | undefined): TourRecords {
  if (!storage) return {};
  try {
    const raw = storage.getItem(tourStorageKey(userId));
    if (!raw) return {};
    const parsed = tourRecordsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch (error) {
    console.warn("tour-storage: could not read tour progress; treating every tour as unseen", error);
    return {};
  }
}

export function writeTourRecord(
  storage: TourStorage | null,
  userId: string | null | undefined,
  tourId: TourId,
  record: { status: TourStatus; version: number },
  now: Date = new Date(),
): void {
  if (!storage) return;
  try {
    const next: TourRecords = {
      ...readTourRecords(storage, userId),
      [tourId]: { ...record, at: now.toISOString() } satisfies TourRecord,
    };
    storage.setItem(tourStorageKey(userId), JSON.stringify(next));
  } catch (error) {
    // Losing this only means the tour may auto-start once more; never break the page for it.
    console.warn(`tour-storage: could not save progress for the ${tourId} tour`, error);
  }
}

/** The browser's localStorage, or null where it is unavailable (server, blocked, sandboxed). */
export function browserTourStorage(): TourStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
