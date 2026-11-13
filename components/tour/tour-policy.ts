import type { TourDefinition, TourEndReason, TourRecord, TourStatus, TourStep } from "./tour.types";

/** A tour with fewer usable targets than this is not worth interrupting someone for. */
export const MIN_TOUR_TARGETS = 3;

/** Has this person already finished or dismissed this version of the tour? */
export function hasSeenTour(record: TourRecord | undefined, version: number): boolean {
  return record !== undefined && record.version >= version;
}

/**
 * What to remember when a tour ends. Finishing and every deliberate dismissal
 * (close button, Escape, clicking the overlay) stop future auto-starts. A tour
 * cut short by navigation or replaced by another records nothing, so it is
 * offered again on the next visit.
 */
export function statusForEndReason(reason: TourEndReason | undefined): TourStatus | null {
  switch (reason) {
    case "done":
      return "completed";
    case "close":
    case "escape":
    case "overlay":
      return "dismissed";
    default:
      return null;
  }
}

export type TourStepContext = {
  isAuthenticated: boolean;
  /** Returns the visible element for a `data-tour` value, or null when it is missing or hidden. */
  findTarget: (target: string) => Element | null;
};

/**
 * How a step will be shown:
 * - `target`: its control is on screen now.
 * - `deferred`: its control sits inside a menu or panel the tour opens first.
 * - `fallback`: the control is missing, so the step's fallback text is shown centred.
 * - `centred`: the step points at nothing by design (a welcome card).
 */
export type ResolvedStepMode = "target" | "deferred" | "fallback" | "centred";

export type ResolvedTourStep = {
  step: TourStep;
  element: Element | null;
  mode: ResolvedStepMode;
};

/**
 * Keeps only the steps that can be shown right now, skipping those whose
 * control is missing and that have nothing else to say.
 */
export function resolveTourSteps(tour: TourDefinition, context: TourStepContext): ResolvedTourStep[] {
  const resolved: ResolvedTourStep[] = [];
  for (const step of tour.steps) {
    if (step.requiresAuth && !context.isAuthenticated) continue;
    if (step.unless && context.findTarget(step.unless)) continue;
    if (!step.target) {
      resolved.push({ step, element: null, mode: "centred" });
      continue;
    }
    const element = context.findTarget(step.target);
    if (element) {
      resolved.push({ step, element, mode: "target" });
    } else if (step.opens && context.findTarget(step.opens)) {
      resolved.push({ step, element: null, mode: "deferred" });
    } else if (step.fallback) {
      resolved.push({ step, element: null, mode: "fallback" });
    }
  }
  return resolved;
}

/** Steps that point at a real control, now or once their menu opens. */
export function countTargets(steps: readonly ResolvedTourStep[]): number {
  return steps.filter((entry) => entry.mode === "target" || entry.mode === "deferred").length;
}

/** Steps that teach something: every step except a lone welcome card. */
export function countTeachingSteps(steps: readonly ResolvedTourStep[]): number {
  return steps.filter((entry) => entry.mode !== "centred").length;
}

export type AutoStartInput = {
  ready: boolean;
  eligible: boolean;
  record: TourRecord | undefined;
  version: number;
  anotherTourActive: boolean;
  overlayOpen: boolean;
};

/** Every condition that must hold before a tour may start on its own. */
export function canAutoStartTour(input: AutoStartInput): boolean {
  return (
    input.ready &&
    input.eligible &&
    !input.anotherTourActive &&
    !input.overlayOpen &&
    !hasSeenTour(input.record, input.version)
  );
}
