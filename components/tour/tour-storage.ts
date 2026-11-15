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

function tourHiddenKey(userId: string | null | undefined): string {
  return `${tourStorageKey(userId)}:hidden`;
}

/** True once this person chose "Don't show me again" in this browser. */
export function readToursHidden(storage: TourStorage | null, userId: string | null | undefined): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(tourHiddenKey(userId)) === "true";
  } catch (error) {
    console.warn("tour-storage: could not read the tips setting; tips stay on", error);
    return false;
  }
}

export function writeToursHidden(storage: TourStorage | null, userId: string | null | undefined): void {
  if (!storage) return;
  try {
    storage.setItem(tourHiddenKey(userId), "true");
  } catch (error) {
    console.warn("tour-storage: could not save the tips setting in this browser", error);
  }
}

/**
 * Adds the tours this account has already been shown (saved on the account,
 * so on any browser) to this browser's own records. A tour seen elsewhere
 * reads as dismissed: it will not open by itself again, and it only gets a
 * tick once it is finished here.
 */
export function mergeAccountTourRecords(local: TourRecords, seenOnAccount: Readonly<Record<string, number>>): TourRecords {
  const merged: TourRecords = { ...local };
  for (const id of TOUR_IDS) {
    const version = seenOnAccount[id];
    if (typeof version !== "number" || !Number.isFinite(version)) continue;
    const record = merged[id];
    if (!record || record.version < version) merged[id] = { status: "dismissed", version, at: "" };
  }
  return merged;
}

/** The browser's localStorage, or null where it is unavailable (server, blocked, sandboxed). */
export function browserTourStorage(): TourStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
