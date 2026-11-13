/** Every first-time tour Navio ships. Add an id here before adding a tour. */
export const TOUR_IDS = ["dashboard", "planner", "community"] as const;
export type TourId = (typeof TOUR_IDS)[number];

export type TourSide = "top" | "right" | "bottom" | "left";
export type TourAlign = "start" | "center" | "end";

export type TourStep = {
  /**
   * Value of the `data-tour` attribute to highlight. Omit it for a centred
   * step that points at nothing, such as the welcome card.
   */
  target?: string;
  title: string;
  description: string;
  side?: TourSide;
  align?: TourAlign;
  /** Skip this step for signed-out visitors (the control needs an account). */
  requiresAuth?: boolean;
};

export type TourDefinition = {
  id: TourId;
  /**
   * Bump only when the tour changes enough that people who saw it should see
   * it again. Copy fixes do not count.
   */
  version: number;
  /** Plain name used in the Help button's accessible label. */
  label: string;
  steps: readonly TourStep[];
};

export type TourStatus = "completed" | "dismissed";

export type TourRecord = {
  status: TourStatus;
  version: number;
  /** ISO timestamp of when the record was written. */
  at: string;
};

export type TourRecords = Partial<Record<TourId, TourRecord>>;

/** How a running tour ended, as reported by Driver.js. */
export type TourEndReason = "done" | "close" | "escape" | "overlay" | "replaced" | "api";
