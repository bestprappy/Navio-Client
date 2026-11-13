"use client";

import "driver.js/dist/driver.css";
import "./tour.css";

import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";

import { pageTourAtom } from "./tour.atoms";
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
   * owner on an editable plan). The Help button still works when false.
   */
  eligible?: boolean;
  /** Runs before a Help-button replay so the tour's controls are on screen. */
  prepare?: () => void;
};

/** Settle time after the page reports ready, so late layout shifts finish first. */
const SETTLE_MS = 600;

/**
 * Registers a page's tour for the Help button and starts it once, the first
 * time this person opens the page in this browser.
 */
export function PageTour({ tour, ready, eligible = true, prepare }: PageTourProps) {
  const setPageTour = useSetAtom(pageTourAtom);
  const { activeTourId, isSessionLoading, readRecord, start } = useTour();
  // One automatic attempt per visit; leaving and coming back allows another.
  const attemptedRef = useRef(false);

  useEffect(() => {
    setPageTour({ tour, ready, prepare });
    return () => setPageTour((current) => (current?.tour.id === tour.id ? null : current));
  }, [prepare, ready, setPageTour, tour]);

  // A tour belongs to its page: leaving the page ends it without marking it seen.
  useEffect(() => () => stopTour(tour.id), [tour.id]);

  useEffect(() => {
    if (attemptedRef.current || isSessionLoading) return;
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
  }, [activeTourId, eligible, isSessionLoading, readRecord, ready, start, tour]);

  return null;
}
