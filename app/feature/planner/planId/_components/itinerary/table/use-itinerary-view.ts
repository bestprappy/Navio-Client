"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

export type ItineraryView = "plan" | "table";

const VIEW_PARAM = "view";

/**
 * Which itinerary view is open, kept in the URL as `?view=table` so the page can be
 * linked and the browser's Back button returns to the previous view. Other query
 * parameters, such as a new plan's destination, are kept.
 */
export function useItineraryView(): [ItineraryView, (view: ItineraryView) => void] {
  const searchParams = useSearchParams();
  const view: ItineraryView = searchParams.get(VIEW_PARAM) === "table" ? "table" : "plan";

  const setView = useCallback((next: ItineraryView) => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get(VIEW_PARAM) === "table" ? "table" : "plan") === next) return;
    if (next === "table") params.set(VIEW_PARAM, "table");
    else params.delete(VIEW_PARAM);
    const query = params.toString();
    // Next.js syncs native history updates with useSearchParams.
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);

  return [view, setView];
}
