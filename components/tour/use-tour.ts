"use client";

import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { notify } from "@/components/toast/notify";
import { currentUserProfileQueryKey, getMyProfile, updateTipPreferences, type TipPreferencesUpdate } from "@/lib/profile-api";
import { activeTourAtom, tourProgressVersionAtom } from "./tour.atoms";
import { startTour, type StartTourResult } from "./tour-controller";
import { hasSeenTour, statusForEndReason } from "./tour-policy";
import {
  browserTourStorage,
  mergeAccountTourRecords,
  readTourRecords,
  readToursHidden,
  writeTourRecord,
  writeToursHidden,
} from "./tour-storage";
import type { TourDefinition, TourRecord, TourRecords, TourStatus } from "./tour.types";

export type StartOptions = {
  /** Control that started the tour; focus returns here afterwards. */
  opener?: HTMLElement | null;
  /** True when a person asked for the tour, so it runs even when nothing is on screen to point at yet. */
  requested?: boolean;
  /**
   * True when the tour opened by itself. It counts as seen the moment it starts,
   * however it ends, and it offers "Don't show me again".
   */
  automatic?: boolean;
};

const NO_SEEN_TIPS: Readonly<Record<string, number>> = {};

/**
 * Starts tours for the signed-in person (or a guest) and remembers which ones
 * they have seen. A signed-in account's progress is saved on the account, so a
 * tour opens by itself once per account rather than once per browser; this
 * browser keeps a copy so it still works when the profile service is slow,
 * down, or an older version that does not store tips yet.
 */
export function useTour() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const activeTourId = useAtomValue(activeTourAtom);
  // Read so components re-render (and re-read storage) when a tour ends.
  const progressVersion = useAtomValue(tourProgressVersionAtom);
  const bumpProgress = useSetAtom(tourProgressVersionAtom);
  const isAuthenticated = status === "authenticated" && Boolean(session?.user) && !session?.error;
  const userId = isAuthenticated ? session?.user?.id ?? null : null;
  const isSessionLoading = status === "loading";

  // Same key as the navbar and Settings, so this shares their cached profile.
  const profileKey = currentUserProfileQueryKey(userId);
  const profile = useQuery({
    queryKey: profileKey,
    queryFn: getMyProfile,
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const seenOnAccount = profile.data?.preferences.seenTips ?? NO_SEEN_TIPS;
  const hiddenOnAccount = profile.data?.preferences.tipsHidden ?? false;
  // Wait for the account's answer before opening anything by itself; a failed load falls back to this browser.
  const isProgressLoading = isSessionLoading || (Boolean(userId) && profile.isPending);

  const saveToAccount = useMutation({
    mutationFn: (update: TipPreferencesUpdate) => updateTipPreferences(update),
    onSuccess: (saved) => queryClient.setQueryData(profileKey, saved),
    // This browser already has it, so the tour still won't repeat here.
    onError: (error) => console.warn("useTour: could not save tips progress to the account", error),
  });
  const { mutate: sendToAccount } = saveToAccount;
  // Tour versions already sent in this page view, so a tour's start and end save it once.
  const sentRef = useRef(new Set<string>());

  const readRecords = useCallback((): TourRecords => {
    // A new progressVersion means a tour just ended; the callback changes so callers re-read.
    void progressVersion;
    return mergeAccountTourRecords(readTourRecords(browserTourStorage(), userId), seenOnAccount);
  }, [progressVersion, seenOnAccount, userId]);

  const readRecord = useCallback(
    (tour: TourDefinition): TourRecord | undefined => readRecords()[tour.id],
    [readRecords],
  );

  const isHidden = useCallback((): boolean => {
    void progressVersion;
    return hiddenOnAccount || readToursHidden(browserTourStorage(), userId);
  }, [hiddenOnAccount, progressVersion, userId]);

  /** Saves how a tour went, here and (when signed in) on the account. */
  const record = useCallback(
    (tour: TourDefinition, tourStatus: TourStatus) => {
      writeTourRecord(browserTourStorage(), userId, tour.id, { status: tourStatus, version: tour.version });
      const sentKey = `${userId}:${tour.id}:${tour.version}`;
      if (!userId || (seenOnAccount[tour.id] ?? 0) >= tour.version || sentRef.current.has(sentKey)) return;
      sentRef.current.add(sentKey);
      sendToAccount({ seenTips: { [tour.id]: tour.version } });
    },
    [seenOnAccount, sendToAccount, userId],
  );

  const hideTips = useCallback(() => {
    writeToursHidden(browserTourStorage(), userId);
    if (userId) sendToAccount({ tipsHidden: true });
    bumpProgress((value) => value + 1);
    notify.info({ title: "Tips won't open on their own", description: "Show tips in the menu still has every tour." });
  }, [bumpProgress, sendToAccount, userId]);

  const start = useCallback(
    async (tour: TourDefinition, { opener, requested = false, automatic = false }: StartOptions = {}): Promise<StartTourResult> => {
      const result = await startTour({
        tour,
        isAuthenticated,
        opener,
        // Someone asked: run even if only explanations are left (a feature not set up yet).
        minTargets: requested ? 0 : undefined,
        onHide: automatic ? hideTips : undefined,
        onEnd: (reason) => {
          const ended = statusForEndReason(reason);
          if (ended) record(tour, ended);
          bumpProgress((value) => value + 1);
        },
      });
      // Shown once is enough: leaving the page or signing out mid-tour must not bring it back next time.
      if (result === "started" && automatic && !hasSeenTour(readRecord(tour), tour.version)) {
        record(tour, "dismissed");
      }
      return result;
    },
    [bumpProgress, hideTips, isAuthenticated, readRecord, record],
  );

  return { activeTourId, isAuthenticated, isProgressLoading, isSessionLoading, isHidden, readRecord, readRecords, start };
}
