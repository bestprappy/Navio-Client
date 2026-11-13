import { atom } from "jotai";

import type { TourId, TourDefinition } from "./tour.types";

/** The tour currently on screen. Only one can run at a time. */
export const activeTourAtom = atom<TourId | null>(null);

/** Bumped whenever a tour ends, so menus re-read which tours are finished. */
export const tourProgressVersionAtom = atom(0);

export type PageTourRegistration = {
  tour: TourDefinition;
  /** True once the page has loaded enough for its tour targets to be real. */
  ready: boolean;
  /** Starts by itself the first time. Feature tours leave this off and wait to be asked. */
  autoStart: boolean;
  /** Puts the page in a state where the tour's controls are visible, such as switching a phone back to the itinerary. */
  prepare?: () => void;
};

/**
 * Tours that belong to the page on screen, in the order the page registered
 * them, as registered by `<PageTour>`. The tips menu reads this, so it never
 * needs to know about feature code.
 */
export const pageToursAtom = atom<readonly PageTourRegistration[]>([]);
