"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";

import { activeTourAtom } from "./tour.atoms";
import { startTour, type StartTourResult } from "./tour-controller";
import { statusForEndReason } from "./tour-policy";
import { browserTourStorage, readTourRecords, writeTourRecord } from "./tour-storage";
import type { TourDefinition, TourRecord } from "./tour.types";

/**
 * Starts tours for the signed-in person (or a guest) and remembers how each one
 * ended in this browser, so it auto-starts only once.
 */
export function useTour() {
  const { data: session, status } = useSession();
  const activeTourId = useAtomValue(activeTourAtom);
  const isAuthenticated = status === "authenticated" && Boolean(session?.user) && !session?.error;
  const userId = isAuthenticated ? session?.user?.id ?? null : null;
  const isSessionLoading = status === "loading";

  const readRecord = useCallback(
    (tour: TourDefinition): TourRecord | undefined => readTourRecords(browserTourStorage(), userId)[tour.id],
    [userId],
  );

  const start = useCallback(
    (tour: TourDefinition, opener?: HTMLElement | null): Promise<StartTourResult> =>
      startTour({
        tour,
        isAuthenticated,
        opener,
        onEnd: (reason) => {
          const ended = statusForEndReason(reason);
          if (ended) writeTourRecord(browserTourStorage(), userId, tour.id, { status: ended, version: tour.version });
        },
      }),
    [isAuthenticated, userId],
  );

  return { activeTourId, isAuthenticated, isSessionLoading, readRecord, start };
}
