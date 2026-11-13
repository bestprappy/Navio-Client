"use client";

import "driver.js/dist/driver.css";
import "./tour.css";

import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";

import { pageToursAtom, type PageTourRegistration } from "./tour.atoms";
import { stopTour } from "./tour-controller";
import { isOverlayOpen } from "./tour-dom";
import { canAutoStartTour } from "./tour-policy";
import type { TourDefinition } from "./tour.types";
import { useTour } from "./use-tour";

type PageTourProps = {
  tour: TourDefinition;
  /** The page has loaded: queries settled, no skeleton or error state on screen. */
  ready: boolean;
  /**
   * This viewer should get the tour automatically (for example, the trip's
   * owner on an editable plan). The tips menu still offers it when false.
   */
  eligible?: boolean;
  /** Start by itself the first time. Feature tours set this to false and wait to be asked. */
  autoStart?: boolean;
  /** Runs before a replay from the tips menu so the tour's controls are on screen. */
  prepare?: () => void;
};

/** Settle time after the page reports ready, so late layout shifts finish first. */
const SETTLE_MS = 600;

function upsert(list: readonly PageTourRegistration[], next: PageTourRegistration): readonly PageTourRegistration[] {
  const index = list.findIndex((entry) => entry.tour.id === next.tour.id);
  if (index < 0) return [...list, next];
  const copy = [...list];
  copy[index] = next;
  return copy;
}

/**
 * Registers a page's tour for the tips menu and, unless `autoStart` is off,
 * starts it once the first time this person opens the page in this browser.
 */
export function PageTour({ tour, ready, eligible = true, autoStart = true, prepare }: PageTourProps) {
  const setPageTours = useSetAtom(pageToursAtom);
  const { activeTourId, isSessionLoading, readRecord, start } = useTour();
  // One automatic attempt per visit; leaving and coming back allows another.
  const attemptedRef = useRef(false);

  useEffect(() => {
    setPageTours((list) => upsert(list, { tour, ready, autoStart, prepare }));
  }, [autoStart, prepare, ready, setPageTours, tour]);

  useEffect(
    () => () => setPageTours((list) => list.filter((entry) => entry.tour.id !== tour.id)),
    [setPageTours, tour.id],
  );

  // A tour belongs to its page: leaving the page ends it without marking it seen.
  useEffect(() => () => stopTour(tour.id), [tour.id]);

  useEffect(() => {
    if (!autoStart || attemptedRef.current || isSessionLoading) return;
    const preconditions = {
      ready,
      eligible,
      version: tour.version,
      anotherTourActive: activeTourId !== null,
    };
    if (!canAutoStartTour({ ...preconditions, record: readRecord(tour), overlayOpen: false })) return;

    const timer = window.setTimeout(() => {
      // Re-check what may have changed while the page settled.
      if (!canAutoStartTour({ ...preconditions, record: readRecord(tour), overlayOpen: isOverlayOpen() })) return;
      attemptedRef.current = true;
      void start(tour).catch((error: unknown) => console.error(`PageTour: the ${tour.id} tour failed to start`, error));
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [activeTourId, autoStart, eligible, isSessionLoading, readRecord, ready, start, tour]);

  return null;
}
