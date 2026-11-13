import type { Driver, DriveStep } from "driver.js";
import { getDefaultStore } from "jotai";

import { activeTourAtom } from "./tour.atoms";
import {
  fallbackFocusTarget,
  findVisibleTourTarget,
  prefersReducedMotion,
  setTriggerOpen,
  waitForTourTarget,
} from "./tour-dom";
import { createLayoutTracker } from "./tour-layout-tracker";
import { decorateTourPopover } from "./tour-popover";
import {
  countTargets,
  countTeachingSteps,
  MIN_TOUR_TARGETS,
  resolveTourSteps,
  type ResolvedTourStep,
} from "./tour-policy";
import type { TourDefinition, TourEndReason } from "./tour.types";

/**
 * Runs one Driver.js tour at a time. Driver.js is imported only when a tour
 * actually starts, so pages without a running tour never download it.
 *
 * Steps can point inside a menu: the controller opens that menu before the
 * step (by pressing its trigger, as a person would), closes it when the tour
 * moves elsewhere, and shows the step's fallback text when the control still
 * is not there. Nothing that changes a trip is ever pressed.
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
  /**
   * Fewest real controls worth running for. Automatic tours keep the default;
   * a tour someone asked for runs as long as it has anything to teach.
   */
  minTargets?: number;
};

export type StartTourResult = "started" | "busy" | "too-few-targets" | "failed";

const PULSE_CLASS = "navio-tour-pulse";
const CENTRED_CLASS = "navio-tour--centered";
const DUMMY_ELEMENT_ID = "driver-dummy-element";

function popoverTextFor(entry: ResolvedTourStep) {
  return entry.mode === "fallback" && entry.step.fallback ? entry.step.fallback : entry.step;
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

export async function startTour({
  tour,
  isAuthenticated,
  opener,
  onEnd,
  minTargets = MIN_TOUR_TARGETS,
}: StartTourOptions): Promise<StartTourResult> {
  if (isTourRunning()) return "busy";

  const steps = resolveTourSteps(tour, { isAuthenticated, findTarget: findVisibleTourTarget });
  if (countTargets(steps) < minTargets || countTeachingSteps(steps) === 0) return "too-few-targets";

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
  // Elements found at run time for steps that live inside a menu.
  const liveElements = new Map<number, Element | null>();
  let previousIndex = 0;
  let openedTrigger: Element | null = null;
  let openedKey: string | null = null;
  let navigating = false;
  let finished = false;
  let forcedReason: TourEndReason | null = null;

  // Re-measure when the page moves under the spotlight; paused while Driver.js animates between steps.
  const layout = createLayoutTracker(() => {
    if (instance.isActive()) instance.refresh();
  });

  function syncMenu(entry: ResolvedTourStep) {
    const wanted = entry.mode === "deferred" || entry.mode === "target" ? entry.step.opens ?? null : null;
    if (openedTrigger && openedKey !== wanted) {
      setTriggerOpen(openedTrigger, false);
      openedTrigger = null;
      openedKey = null;
    }
    if (!wanted) return;
    const trigger = openedTrigger ?? findVisibleTourTarget(wanted);
    if (!trigger) return;
    setTriggerOpen(trigger, true);
    openedTrigger = trigger;
    openedKey = wanted;
  }

  /** Gets a step ready to show. False means skip it: its control is missing and it has nothing else to say. */
  async function prepare(index: number): Promise<boolean> {
    const entry = steps[index];
    if (!entry) return false;
    syncMenu(entry);
    if (entry.mode !== "deferred" && !(entry.mode === "target" && !entry.element?.isConnected)) return true;
    // Long enough for a menu that just opened to render; short enough that a fallback doesn't feel stuck.
    const element = entry.step.target ? await waitForTourTarget(entry.step.target, 700) : null;
    liveElements.set(index, element);
    return element !== null || Boolean(entry.step.fallback);
  }

  function endWith(reason: TourEndReason) {
    forcedReason = reason;
    instance.destroy();
    finish(reason);
  }

  async function go(delta: 1 | -1) {
    if (navigating || finished) return;
    navigating = true;
    try {
      const current = instance.getActiveIndex() ?? 0;
      for (let next = current + delta; next >= 0 && next < steps.length; next += delta) {
        if (await prepare(next)) {
          if (!finished) instance.moveTo(next);
          return;
        }
      }
      if (delta > 0) endWith("done");
    } catch (error) {
      console.error(`tour-controller: the ${tour.id} tour could not move on`, error);
      endWith("api");
    } finally {
      navigating = false;
    }
  }

  function toDriveStep(entry: ResolvedTourStep, index: number): DriveStep {
    const text = popoverTextFor(entry);
    const pointsAtSomething = entry.mode === "target" || entry.mode === "deferred";
    return {
      element: pointsAtSomething
        ? () => (liveElements.get(index) ?? (entry.element?.isConnected ? entry.element : null) ?? findVisibleTourTarget(entry.step.target ?? "")) as Element
        : undefined,
      popover: {
        title: text.title,
        description: text.description,
        side: entry.step.side,
        align: entry.step.align ?? "start",
        showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
        popoverClass: pointsAtSomething ? "navio-tour" : `navio-tour ${CENTRED_CLASS}`,
      },
    };
  }

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
    // Buttons and arrow keys both come through here, so menus open and close in one place.
    onNextClick: () => void go(1),
    onPrevClick: () => void go(-1),
    onPopoverRender: (popover, { state }) => {
      const index = state.activeIndex ?? 0;
      const entry = steps[index];
      // A control expected inside a menu never appeared: explain instead of pointing at nothing.
      if (entry?.mode === "deferred" && state.activeElement?.id === DUMMY_ELEMENT_ID && entry.step.fallback) {
        popover.title.textContent = entry.step.fallback.title;
        popover.description.textContent = entry.step.fallback.description;
        popover.wrapper.classList.add(CENTRED_CLASS);
      }
      decorateTourPopover(popover, { index, total, previousIndex, reducedMotion });
      previousIndex = index;
      // Driver.js focuses the close button; start on the primary action so Enter moves on.
      requestAnimationFrame(() => {
        if (popover.wrapper.isConnected) popover.nextButton.focus({ preventScroll: true });
      });
    },
    onHighlightStarted: () => layout.pause(),
    onHighlighted: (element) => {
      const real = element && element.id !== DUMMY_ELEMENT_ID ? element : null;
      layout.track(real);
      if (!real || reducedMotion) return;
      real.classList.remove(PULSE_CLASS);
      // Restart the one-shot ring even when the same element is highlighted again.
      void (real as HTMLElement).offsetWidth;
      real.classList.add(PULSE_CLASS);
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

  function finish(reason: TourEndReason | undefined) {
    if (finished) return;
    finished = true;
    layout.stop();
    if (openedTrigger) setTriggerOpen(openedTrigger, false);
    document.querySelectorAll(`.${PULSE_CLASS}`).forEach((element) => element.classList.remove(PULSE_CLASS));
    if (running?.instance === instance) running = null;
    store.set(activeTourAtom, null);
    try {
      onEnd?.(forcedReason ?? reason);
    } catch (error) {
      console.error(`tour-controller: the ${tour.id} tour's end handler failed`, error);
    }
    restoreFocus(returnFocusTo);
  }

  running = { tourId: tour.id, instance, finish };
  starting = false;
  try {
    // The first step may also live inside a menu.
    const firstUsable = await (async () => {
      for (let index = 0; index < steps.length; index += 1) {
        if (await prepare(index)) return index;
      }
      return -1;
    })();
    if (firstUsable < 0 || finished) {
      if (!finished) finish("api");
      return "too-few-targets";
    }
    instance.drive(firstUsable);
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
