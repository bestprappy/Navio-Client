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

export type ResolvedTourStep = {
  step: TourStep;
  element: Element | null;
};

/**
 * Keeps only the steps that can be shown right now: centred steps always, and
 * targeted steps whose control exists, is visible, and is available to this viewer.
 */
export function resolveTourSteps(tour: TourDefinition, context: TourStepContext): ResolvedTourStep[] {
  const resolved: ResolvedTourStep[] = [];
  for (const step of tour.steps) {
    if (step.requiresAuth && !context.isAuthenticated) continue;
    if (!step.target) {
      resolved.push({ step, element: null });
      continue;
    }
    const element = context.findTarget(step.target);
    if (element) resolved.push({ step, element });
  }
  return resolved;
}

export function countTargets(steps: readonly ResolvedTourStep[]): number {
  return steps.filter((entry) => entry.element !== null).length;
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
