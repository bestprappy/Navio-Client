/** Every first-time tour Navio ships. Add an id here before adding a tour. */
export const TOUR_IDS = [
  "dashboard",
  "planner",
  "community",
  "planner-days",
  "planner-auto-plan",
  "planner-notes",
  "planner-ev",
  "planner-charging",
  "planner-budget",
  "planner-share",
] as const;
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
  /**
   * `data-tour` value of a menu or panel trigger to press before this step,
   * because the target lives inside it. The tour closes it again afterwards.
   * Tours only open things; they never press anything that changes the trip.
   */
  opens?: string;
  /**
   * Skip this step while this `data-tour` control is on screen. Pairs two
   * steps: one for when a feature is set up, one pointing at how to set it up.
   */
  unless?: string;
  /**
   * Shown centred instead when the target is not on screen, usually because
   * the feature needs something first (places in a day, a car in the garage).
   */
  fallback?: { title: string; description: string };
};

export type TourDefinition = {
  id: TourId;
  /**
   * Bump only when the tour changes enough that people who saw it should see
   * it again. Copy fixes do not count.
   */
  version: number;
  /** Plain name used in the Help button's accessible label and the tips menu. */
  label: string;
  /** One short line for the tips menu, saying what the tour teaches. */
  summary?: string;
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
