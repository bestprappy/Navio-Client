"use client";

import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { EvStationSidePanel } from "../charger/ev-station-side-panel";
import type { EvCharger } from "../constants/types";
import {
  activePlannerSidePanelAtom,
  addEvChargerToBlockAtom,
  clearEvChargerResultsAtom,
  evChargerResultsAtom,
  selectEvChargerAtom,
  selectedEvChargerResultAtom,
  selectedTripPlacesAtom,
} from "../overview/trip-builder.atoms";

export function PlannerSidePanelHost() {
  const activePanel = useAtomValue(activePlannerSidePanelAtom);
  const evChargerResults = useAtomValue(evChargerResultsAtom);
  const selectedEvChargerResult = useAtomValue(selectedEvChargerResultAtom);
  const selectedTripPlaces = useAtomValue(selectedTripPlacesAtom);
  const addEvChargerToBlock = useSetAtom(addEvChargerToBlockAtom);
  const clearEvChargerResults = useSetAtom(clearEvChargerResultsAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);

  const addedChargerIds = useMemo(
    () =>
      new Set(
        selectedTripPlaces
          .map((place) => place.placeId)
          .filter((placeId) => placeId.startsWith("ev-charger:"))
          .map((placeId) => placeId.replace("ev-charger:", "")),
      ),
    [selectedTripPlaces],
  );

  function addChargerToTrip(blockId: string, charger: EvCharger) {
    addEvChargerToBlock({ blockId, charger });
  }

  if (activePanel?.type !== "ev-stations") {
    return null;
  }

  return (
    <EvStationSidePanel
      activeBlockId={activePanel.blockId}
      results={evChargerResults}
      selectedResult={selectedEvChargerResult}
      addedChargerIds={addedChargerIds}
      onAddCharger={addChargerToTrip}
      onClose={() => clearEvChargerResults()}
      onSelect={(chargerId) => selectEvCharger(chargerId)}
    />
  );
}
