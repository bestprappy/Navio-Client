import type { Driver, DriveStep } from "driver.js";
import { getDefaultStore } from "jotai";

import { activeTourAtom } from "./tour.atoms";
import { fallbackFocusTarget, findVisibleTourTarget, prefersReducedMotion } from "./tour-dom";
import { decorateTourPopover } from "./tour-popover";
import { countTargets, MIN_TOUR_TARGETS, resolveTourSteps, type ResolvedTourStep } from "./tour-policy";
import type { TourDefinition, TourEndReason } from "./tour.types";

/**
 * Runs one Driver.js tour at a time. Driver.js is imported only when a tour
 * actually starts, so pages without a running tour never download it.
 */

type RunningTour = {
  tourId: TourDefinition["id"];
  instance: Driver;
  /** Ends the tour exactly once, however it ends. */
  finish: (reason: TourEndReason | undefined) => void;
};

let running: RunningTour | null = null;
let starting = false;

export type StartTourOptions = {
  tour: TourDefinition;
  isAuthenticated: boolean;
  /** Control that started the tour; focus returns here afterwards. */
  opener?: HTMLElement | null;
  /** Called once when the tour ends, with how it ended. */
  onEnd?: (reason: TourEndReason | undefined) => void;
};

export type StartTourResult = "started" | "busy" | "too-few-targets" | "failed";

const PULSE_CLASS = "navio-tour-pulse";

function toDriveStep({ step, element }: ResolvedTourStep, index: number): DriveStep {
  return {
    element: element ?? undefined,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side,
      align: step.align ?? "start",
      showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
      popoverClass: element ? "navio-tour" : "navio-tour navio-tour--centered",
    },
  };
}

function restoreFocus(target: HTMLElement | null) {
  // Driver.js moves focus itself right after onDestroyed; wait until it has.
  requestAnimationFrame(() => {
    const destination = target?.isConnected ? target : fallbackFocusTarget();
    destination?.focus({ preventScroll: true });
  });
}

export function isTourRunning(): boolean {
  return running !== null || starting;
}

export async function startTour({ tour, isAuthenticated, opener, onEnd }: StartTourOptions): Promise<StartTourResult> {
  if (isTourRunning()) return "busy";

  const steps = resolveTourSteps(tour, { isAuthenticated, findTarget: findVisibleTourTarget });
  if (countTargets(steps) < MIN_TOUR_TARGETS) return "too-few-targets";

  const store = getDefaultStore();
  starting = true;
  store.set(activeTourAtom, tour.id);

  let driverFactory: typeof import("driver.js").driver;
  try {
    driverFactory = (await import("driver.js")).driver;
  } catch (error) {
    console.error(`tour-controller: could not load the tour library for the ${tour.id} tour`, error);
    starting = false;
    store.set(activeTourAtom, null);
    return "failed";
  }

  const reducedMotion = prefersReducedMotion();
  const focusBefore = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
    ? document.activeElement
    : null;
  const returnFocusTo = opener ?? focusBefore;
  const isDark = document.documentElement.classList.contains("dark");
  const total = steps.length;
  let previousIndex = 0;

  const instance = driverFactory({
    steps: steps.map(toDriveStep),
    animate: !reducedMotion,
    smoothScroll: !reducedMotion,
    duration: 360,
    overlayColor: "var(--scrim)",
    overlayOpacity: isDark ? 0.72 : 0.58,
    stagePadding: 6,
    stageRadius: 14,
    popoverOffset: 14,
    allowClose: true,
    allowKeyboardControl: true,
    // Tours point at controls; they never press them for the person.
    disableActiveInteraction: true,
    showProgress: false,
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    closeBtnLabel: "Close tips",
    onPopoverRender: (popover, { state }) => {
      const index = state.activeIndex ?? 0;
      decorateTourPopover(popover, { index, total, previousIndex, reducedMotion });
      previousIndex = index;
      // Driver.js focuses the close button; start on the primary action so Enter moves on.
      requestAnimationFrame(() => {
        if (popover.wrapper.isConnected) popover.nextButton.focus({ preventScroll: true });
      });
    },
    onHighlighted: (element) => {
      if (!element || reducedMotion) return;
      element.classList.remove(PULSE_CLASS);
      // Restart the one-shot ring even when the same element is highlighted again.
      void (element as HTMLElement).offsetWidth;
      element.classList.add(PULSE_CLASS);
    },
    onDeselected: (element) => element?.classList.remove(PULSE_CLASS),
    // Driver.js skips onDestroyed when a tour is closed mid-transition (Escape
    // pressed while the first step animates in), so the reason is captured here,
    // where it is always reported, and the tour is ended by finish().
    onDestroyStarted: (_element, _step, { reason }) => {
      instance.destroy();
      finish(reason);
    },
    onDestroyed: (_element, _step, { reason }) => finish(reason),
  });

  let finished = false;
  function finish(reason: TourEndReason | undefined) {
    if (finished) return;
    finished = true;
    document.querySelectorAll(`.${PULSE_CLASS}`).forEach((element) => element.classList.remove(PULSE_CLASS));
    if (running?.instance === instance) running = null;
    store.set(activeTourAtom, null);
    try {
      onEnd?.(reason);
    } catch (error) {
      console.error(`tour-controller: the ${tour.id} tour's end handler failed`, error);
    }
    restoreFocus(returnFocusTo);
  }

  running = { tourId: tour.id, instance, finish };
  starting = false;
  try {
    instance.drive();
  } catch (error) {
    console.error(`tour-controller: the ${tour.id} tour could not start`, error);
    finish("api");
    return "failed";
  }
  return "started";
}

/** Ends the running tour without recording it as seen (used when the page goes away). */
export function stopTour(tourId?: TourDefinition["id"]): void {
  if (!running || (tourId && running.tourId !== tourId)) return;
  const { instance, finish } = running;
  instance.destroy();
  finish("api");
}
