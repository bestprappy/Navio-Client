/**
 * Browser-only helpers for locating tour targets. A control can be rendered
 * more than once (a desktop sidebar and a phone menu), so the first copy that
 * is actually on screen wins.
 */

export function tourTargetSelector(target: string): string {
  return `[data-tour="${CSS.escape(target)}"]`;
}

export function isElementVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) return false;
  if (element.closest("[hidden], [inert], [aria-hidden='true']")) return false;
  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
}

export function findVisibleTourTarget(target: string): Element | null {
  const candidates = document.querySelectorAll(tourTargetSelector(target));
  for (const candidate of candidates) {
    if (isElementVisible(candidate)) return candidate;
  }
  return null;
}

/**
 * True while a dialog, menu or popover the person opened is on screen. A tour
 * must never start on top of something they are in the middle of.
 */
export function isOverlayOpen(): boolean {
  const open = document.querySelectorAll(
    "[role='dialog'], [role='alertdialog'], [role='menu'], [role='listbox'], [data-slot='popover-content'], [data-slot='sheet-content']",
  );
  for (const element of open) {
    if (element.id === "driver-popover-content") continue;
    if (isElementVisible(element)) return true;
  }
  return false;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where focus goes when a tour that no control started comes to an end. */
export function fallbackFocusTarget(): HTMLElement | null {
  const heading = document.querySelector<HTMLElement>("main h1, h1");
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    return heading;
  }
  return document.querySelector<HTMLElement>("main");
}

/** True when a menu or popover trigger reports its popup as open. */
export function isTriggerOpen(trigger: Element): boolean {
  return trigger.getAttribute("aria-expanded") === "true" || trigger.hasAttribute("data-popup-open");
}

/**
 * Opens or closes a menu by pressing its trigger, the same way a person would.
 * Only used for triggers that reveal controls; never for actions.
 */
export function setTriggerOpen(trigger: Element, open: boolean): void {
  if (isTriggerOpen(trigger) === open || !(trigger instanceof HTMLElement)) return;
  trigger.click();
}

/** Resolves with the visible target once it appears, or null after the timeout. */
export function waitForTourTarget(target: string, timeoutMs = 1500): Promise<Element | null> {
  const found = findVisibleTourTarget(target);
  if (found) return Promise.resolve(found);
  return new Promise((resolve) => {
    const started = performance.now();
    const poll = () => {
      const element = findVisibleTourTarget(target);
      if (element) resolve(element);
      else if (performance.now() - started >= timeoutMs) resolve(null);
      else requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  });
}
