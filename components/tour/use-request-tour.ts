"use client";

import { useCallback } from "react";

import { notify } from "@/components/toast/notify";
import type { TourDefinition } from "./tour.types";
import { useTour } from "./use-tour";

type RequestTourOptions = {
  /** Control that asked; focus returns here when the tour ends. */
  opener?: HTMLElement | null;
  /** Runs first, for example to close a phone menu or bring the itinerary back on screen. */
  prepare?: () => void;
};

/**
 * Starts a tour a person asked for, after letting the page settle from
 * whatever `prepare` changed, and explains in a toast if it cannot run.
 */
export function useRequestTour() {
  const { activeTourId, start } = useTour();

  const requestTour = useCallback(
    (tour: TourDefinition, { opener, prepare }: RequestTourOptions = {}) => {
      if (activeTourId) return;
      prepare?.();
      // Two frames: anything prepare closed or switched is gone before targets are measured.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          void start(tour, { opener, requested: true })
            .then((result) => {
              if (result === "too-few-targets") {
                console.warn(`useRequestTour: nothing on screen for the ${tour.id} tour to point at`);
                notify.info({ title: "Tips aren't available here yet", description: "Wait for the page to finish loading, then try again." });
              } else if (result === "failed") {
                notify.error({ title: "Tips didn't open", description: "Refresh the page and try again." });
              }
            })
            .catch((error: unknown) => console.error(`useRequestTour: the ${tour.id} tour failed to start`, error));
        }),
      );
    },
    [activeTourId, start],
  );

  return { isTourRunning: activeTourId !== null, requestTour };
}
