"use client";

import { usePlannerScrollPanelId } from "../layout/planner-scroll-panel-context";

import { useCallback } from "react";
import { useSetAtom } from "jotai";

import {
  activeBlockIdAtom,
  openBlockIdsAtom,
} from "../overview/trip-builder.atoms";
import { expandSectionOfItemAtom } from "./day-sections.atoms";

// Keeps the card off the panel's top edge; small enough that the day's own top
// stays above the scroll-detection threshold, so the active day does not flip.
const SCROLL_OFFSET_PX = 16;

export function getTripItemElementId(itemId: string): string {
  return `trip-item-${itemId}`;
}

function scrollPanelTo(element: HTMLElement, panel: HTMLElement) {
  const top =
    element.getBoundingClientRect().top -
    panel.getBoundingClientRect().top +
    panel.scrollTop -
    SCROLL_OFFSET_PX;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  panel.scrollTo({
    top: Math.max(top, 0),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

/**
 * Brings a trip item's card into view in the itinerary panel: opens its day
 * and its section (collapsed ones do not render their items), marks the day active, then
 * scrolls once the opened content has painted.
 */
export function useRevealPlanCard() {
  const scrollPanelId = usePlannerScrollPanelId();
  const setOpenBlockIds = useSetAtom(openBlockIdsAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const expandSectionOfItem = useSetAtom(expandSectionOfItemAtom);

  return useCallback(
    (blockId: string, itemId?: string) => {
      setOpenBlockIds((ids) => (ids.includes(blockId) ? ids : [...ids, blockId]));
      setActiveBlockId(blockId);
      if (itemId) expandSectionOfItem({ blockId, itemId });

      // Two frames: one for React to commit the opened day, one for layout.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const panel = document.getElementById(scrollPanelId);
          const target =
            (itemId && document.getElementById(getTripItemElementId(itemId))) ||
            document.getElementById(`trip-block-${blockId}`);

          if (!panel || !target) {
            console.warn("Could not scroll to the plan card.", {
              component: "useRevealPlanCard",
              operation: "scrollToPlanCard",
              blockId,
              itemId,
              hasPanel: Boolean(panel),
            });
            return;
          }

          scrollPanelTo(target, panel);
        });
      });
    },
    [expandSectionOfItem, setActiveBlockId, setOpenBlockIds, scrollPanelId],
  );
}
