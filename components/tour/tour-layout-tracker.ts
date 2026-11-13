/**
 * Keeps a tour's spotlight on its control while the page moves underneath it.
 *
 * Driver.js re-measures only on window resize and window scroll. Navio scrolls
 * inside panels (the planner drawer), and sections above a target can grow
 * after the spotlight lands (the garage loads battery charts late), so both
 * would leave the spotlight where the control used to be. This watches nested
 * scrolling and the size of the target and every container above it, and asks
 * for one re-measure per frame at most.
 */
export type LayoutTracker = {
  /** Start following this control (null for a centred step), replacing the previous one. */
  track: (element: Element | null) => void;
  /** Pause re-measuring, for example while Driver.js animates to the next step. */
  pause: () => void;
  stop: () => void;
};

export function createLayoutTracker(onChange: () => void): LayoutTracker {
  let frame: number | null = null;
  let paused = true;
  let stopped = false;

  const schedule = () => {
    if (paused || stopped || frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (!paused && !stopped) onChange();
    });
  };

  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
  // Scroll events do not bubble; capturing on the document sees every scrolling panel.
  document.addEventListener("scroll", schedule, { capture: true, passive: true });

  return {
    track(element) {
      if (stopped) return;
      resizeObserver?.disconnect();
      // A sibling above the control growing resizes a shared ancestor, so watch the whole chain.
      for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
        resizeObserver?.observe(node);
      }
      paused = false;
    },
    pause() {
      paused = true;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    },
    stop() {
      if (stopped) return;
      stopped = true;
      this.pause();
      resizeObserver?.disconnect();
      document.removeEventListener("scroll", schedule, { capture: true });
    },
  };
}
