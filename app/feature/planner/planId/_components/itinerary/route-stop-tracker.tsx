"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";

import {
  focusedRouteStopIdAtom,
  routeLineModeAtom,
} from "../overview/trip-builder.atoms";

const SCROLL_PANEL_ID = "planner-scroll-panel";
// Same line the day tracker uses: a stop is in focus once its top edge crosses
// the upper 30% of the panel.
const FOCUS_LINE_RATIO = 0.3;

/**
 * Marks an itinerary element as standing for a stop's leg. Put it on a stop's
 * card and on the travel row leading to it.
 */
export function routeStopAttributes(stopId: string) {
  return { "data-route-stop": stopId };
}

/** Keeps the focused leg in sync with the itinerary scroll while in "stop" mode. Headless. */
export function RouteStopTracker() {
  const mode = useAtomValue(routeLineModeAtom);
  const setFocusedStopId = useSetAtom(focusedRouteStopIdAtom);
  const store = useStore();

  useEffect(() => {
    if (mode !== "stop") return;
    const panel = document.getElementById(SCROLL_PANEL_ID);
    if (!panel) return;
    const scrollPanel = panel;
    let frame: number | null = null;

    function updateFocusedStop() {
      frame = null;
      const panelRect = scrollPanel.getBoundingClientRect();
      const focusLine = panelRect.top + scrollPanel.clientHeight * FOCUS_LINE_RATIO;
      let crossed: { id: string; top: number } | null = null;
      let nextVisible: { id: string; top: number } | null = null;

      for (const element of scrollPanel.querySelectorAll<HTMLElement>("[data-route-stop]")) {
        const id = element.dataset.routeStop;
        if (!id) continue;
        const { top, height } = element.getBoundingClientRect();
        // Collapsed or hidden content has no box.
        if (height === 0) continue;

        if (top <= focusLine) {
          if (!crossed || top >= crossed.top) crossed = { id, top };
        } else if (top < panelRect.bottom && (!nextVisible || top < nextVisible.top)) {
          nextVisible = { id, top };
        }
      }

      const nextId = (crossed ?? nextVisible)?.id ?? null;
      if (nextId) setFocusedStopId(nextId);
    }

    function scheduleUpdate() {
      if (frame === null) frame = window.requestAnimationFrame(updateFocusedStop);
    }

    scrollPanel.addEventListener("scroll", scheduleUpdate, { passive: true });
    // A leg picked from its travel row stays until the next scroll.
    if (store.get(focusedRouteStopIdAtom) === null) updateFocusedStop();

    return () => {
      scrollPanel.removeEventListener("scroll", scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [mode, setFocusedStopId, store]);

  return null;
}
