import type { PopoverDOM } from "driver.js";

/**
 * Turns Driver.js's plain popover into Navio's: a small route line for progress
 * (stops joined by a line that fills as you go), a readable step count, and an
 * icon close button. Runs on every step because Driver.js rebuilds the popover.
 */

const CLOSE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

export type PopoverProgress = {
  index: number;
  total: number;
  /** Where the route line was on the previous step, so it can grow from there. */
  previousIndex: number;
  reducedMotion: boolean;
};

function fraction(index: number, total: number): number {
  return total <= 1 ? 1 : index / (total - 1);
}

function buildRoute({ index, total, previousIndex, reducedMotion }: PopoverProgress): HTMLElement {
  const route = document.createElement("div");
  route.className = "navio-tour-route";
  route.setAttribute("aria-hidden", "true");
  const start = reducedMotion ? fraction(index, total) : fraction(previousIndex, total);
  route.style.setProperty("--tour-progress", String(start));
  route.style.setProperty("--tour-stops", String(total));

  const line = document.createElement("span");
  line.className = "navio-tour-route-line";
  route.appendChild(line);

  for (let stop = 0; stop < total; stop += 1) {
    const dot = document.createElement("span");
    dot.className = "navio-tour-route-stop";
    dot.dataset.state = stop < index ? "visited" : stop === index ? "current" : "upcoming";
    dot.style.setProperty("--stop-position", String(fraction(stop, total)));
    route.appendChild(dot);
  }

  if (!reducedMotion && start !== fraction(index, total)) {
    // Two frames: the first paints the old length, the second lets the transition run.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => route.style.setProperty("--tour-progress", String(fraction(index, total)))),
    );
  }
  return route;
}

export function decorateTourPopover(popover: PopoverDOM, progress: PopoverProgress): void {
  popover.closeButton.innerHTML = CLOSE_ICON;
  popover.closeButton.title = "Close tips";

  const status = document.createElement("div");
  status.className = "navio-tour-progress";
  status.appendChild(buildRoute(progress));
  const count = document.createElement("span");
  count.className = "navio-tour-count";
  count.textContent = `${progress.index + 1} of ${progress.total}`;
  status.appendChild(count);
  popover.footer.prepend(status);

  // Driver.js hides "Back" with inline display; keep the footer layout stable either way.
  popover.footer.dataset.first = progress.index === 0 ? "true" : "false";
}

const OPT_OUT_CLASS = "navio-tour-optout";

/**
 * Adds "Don't show me again" under the step's buttons, for tours that opened
 * by themselves. Choosing it stops tips opening on their own for this account;
 * Show tips still lists every tour.
 */
export function addTourOptOut(popover: PopoverDOM, onChoose: () => void): void {
  popover.wrapper.querySelector(`.${OPT_OUT_CLASS}`)?.remove();
  const row = document.createElement("div");
  row.className = OPT_OUT_CLASS;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${OPT_OUT_CLASS}-btn`;
  button.textContent = "Don't show me again";
  button.setAttribute("aria-describedby", "navio-tour-optout-hint");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onChoose();
  });
  const hint = document.createElement("span");
  hint.id = "navio-tour-optout-hint";
  hint.className = "sr-only";
  hint.textContent = "Tips will stop opening by themselves. Show tips in the menu still has every tour.";
  row.append(button, hint);
  popover.footer.after(row);
}
