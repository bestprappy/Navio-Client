"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useAtom, useAtomValue } from "jotai";

import { PageTour } from "@/components/tour/page-tour";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { isPersistedTripId } from "@/app/feature/planner/_components/planner-api";
import { useTripMetadata } from "@/app/feature/planner/_components/use-trip-metadata";
import { plannerMobileViewAtom } from "../layout/planner-workspace";
import { useItineraryView } from "../itinerary/table/use-itinerary-view";
import { plannerReadOnlyAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";
import { PLANNER_TOUR } from "./data";

/** Matches planner-workspace.module.css: below this width a phone shows one pane at a time. */
const SPLIT_VIEW_QUERY = "(min-width: 64rem)";

function subscribeToSplitView(onChange: () => void) {
  const query = window.matchMedia(SPLIT_VIEW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsSplitView(): boolean {
  return useSyncExternalStore(
    subscribeToSplitView,
    () => window.matchMedia(SPLIT_VIEW_QUERY).matches,
    () => false,
  );
}

/**
 * The planner's first-time tour. It waits for the trip to load and starts only
 * for the owner of an editable plan, with the itinerary on screen.
 */
export function PlannerTour({ planId }: { planId?: string }) {
  const { isAuthenticated } = useRequireAuth();
  const metadata = useTripMetadata(planId);
  const blockCount = useAtomValue(tripBlocksAtom).length;
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const [mobileView, setMobileView] = useAtom(plannerMobileViewAtom);
  const [itineraryView, setItineraryView] = useItineraryView();
  const isSplitView = useIsSplitView();

  const ready = isPersistedTripId(planId) && metadata.isSuccess && blockCount > 0;
  const itineraryOnScreen = itineraryView === "plan" && (isSplitView || mobileView === "itinerary");
  const eligible = isAuthenticated && !readOnly && itineraryOnScreen;

  // A replay from Help brings the itinerary back if the map or table is covering it.
  const prepare = useCallback(() => {
    setItineraryView("plan");
    setMobileView("itinerary");
  }, [setItineraryView, setMobileView]);

  return <PageTour tour={PLANNER_TOUR} ready={ready} eligible={eligible} prepare={prepare} />;
}
