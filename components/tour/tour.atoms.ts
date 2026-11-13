import { atom } from "jotai";

import type { TourId, TourDefinition } from "./tour.types";

/** The tour currently on screen. Only one can run at a time. */
export const activeTourAtom = atom<TourId | null>(null);

export type PageTourRegistration = {
  tour: TourDefinition;
  /** True once the page has loaded enough for its tour targets to be real. */
  ready: boolean;
  /** Puts the page in a state where the tour's controls are visible, such as switching a phone back to the itinerary. */
  prepare?: () => void;
};

/**
 * The tour that belongs to the page on screen, registered by `<PageTour>`.
 * The Help button reads this, so it never needs to know about feature code.
 */
export const pageTourAtom = atom<PageTourRegistration | null>(null);
