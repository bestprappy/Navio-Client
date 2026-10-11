"use client";

import { useCallback } from "react";
import { useSetAtom } from "jotai";
import { activeSearchAtom, closeSelectedEvChargerAtom, closeSelectedTripPlaceAtom, selectTripPlaceAtom } from "../overview/trip-builder.atoms";
import { focusedAnchorAtom } from "./anchor-map.atoms";
import type { TripLocationVisit } from "./trip-location-markers";
import { useRevealPlanCard } from "./use-reveal-plan-card";

export function useTripLocationSelection() {
  const selectPlace = useSetAtom(selectTripPlaceAtom);
  const closePlace = useSetAtom(closeSelectedTripPlaceAtom);
  const closeCharger = useSetAtom(closeSelectedEvChargerAtom);
  const setSearch = useSetAtom(activeSearchAtom);
  const focusAnchor = useSetAtom(focusedAnchorAtom);
  const reveal = useRevealPlanCard();
  return useCallback((visit: TripLocationVisit) => {
    if (visit.itemId) {
      focusAnchor(null);
      selectPlace({ itemId: visit.itemId });
    } else if (visit.anchor) {
      setSearch(null);
      closePlace();
      closeCharger();
      focusAnchor({ ...visit.anchor });
    }
    reveal(visit.blockId, visit.itemId ?? `${visit.blockId}:${visit.edge}`);
  }, [closeCharger, closePlace, focusAnchor, reveal, selectPlace, setSearch]);
}
