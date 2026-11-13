"use client";

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";

import { activeTourAtom, tourProgressVersionAtom } from "./tour.atoms";
import { startTour, type StartTourResult } from "./tour-controller";
import { statusForEndReason } from "./tour-policy";
import { browserTourStorage, readTourRecords, writeTourRecord } from "./tour-storage";
import type { TourDefinition, TourRecord, TourRecords } from "./tour.types";

export type StartOptions = {
  /** Control that started the tour; focus returns here afterwards. */
  opener?: HTMLElement | null;
  /** True when a person asked for the tour, so it runs even when nothing is on screen to point at yet. */
  requested?: boolean;
};

/**
 * Starts tours for the signed-in person (or a guest) and remembers how each one
 * ended in this browser, so it auto-starts only once and menus can show a tick.
 */
export function useTour() {
  const { data: session, status } = useSession();
  const activeTourId = useAtomValue(activeTourAtom);
  // Read so components re-render (and re-read storage) when a tour ends.
  const progressVersion = useAtomValue(tourProgressVersionAtom);
  const bumpProgress = useSetAtom(tourProgressVersionAtom);
  const isAuthenticated = status === "authenticated" && Boolean(session?.user) && !session?.error;
  const userId = isAuthenticated ? session?.user?.id ?? null : null;
  const isSessionLoading = status === "loading";

  const readRecords = useCallback((): TourRecords => {
    // A new progressVersion means a tour just ended; the callback changes so callers re-read.
    void progressVersion;
    return readTourRecords(browserTourStorage(), userId);
  }, [userId, progressVersion]);

  const readRecord = useCallback(
    (tour: TourDefinition): TourRecord | undefined => readRecords()[tour.id],
    [readRecords],
  );

  const start = useCallback(
    (tour: TourDefinition, { opener, requested = false }: StartOptions = {}): Promise<StartTourResult> =>
      startTour({
        tour,
        isAuthenticated,
        opener,
        // Someone asked: run even if only explanations are left (a feature not set up yet).
        minTargets: requested ? 0 : undefined,
        onEnd: (reason) => {
          const ended = statusForEndReason(reason);
          if (ended) writeTourRecord(browserTourStorage(), userId, tour.id, { status: ended, version: tour.version });
          bumpProgress((value) => value + 1);
        },
      }),
    [bumpProgress, isAuthenticated, userId],
  );

  return { activeTourId, isAuthenticated, isSessionLoading, readRecord, readRecords, start };
}
