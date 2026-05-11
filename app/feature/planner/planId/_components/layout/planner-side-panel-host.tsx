"use client";

import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { EvStationSidePanel } from "../charger/ev-station-side-panel";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type EvCharger,
  type TripBlockData,
} from "../constants/types";
import {
  activePlannerSidePanelAtom,
  addEvChargerToBlockAtom,
  clearEvChargerResultsAtom,
  evChargerResultsAtom,
  selectEvChargerAtom,
  selectedEvChargerResultAtom,
  selectedTripPlacesAtom,
  setEvChargerResultsAtom,
  tripBlocksAtom,
} from "../overview/trip-builder.atoms";

type PlaceAnchor = {
  id: string;
  lat: number;
  lng: number;
};

function getBlockPlaceAnchors(
  blocks: TripBlockData[],
  blockId: string,
): PlaceAnchor[] {
  const block = blocks.find((item) => item.id === blockId);

  if (!block) {
    return [];
  }

  return block.items
    .filter(isPlaceItem)
    .filter((item) => !isEvChargerPlaceItem(item))
    .map((item) => ({ id: item.id, lat: item.lat, lng: item.lng }));
}

export function PlannerSidePanelHost() {
  const activePanel = useAtomValue(activePlannerSidePanelAtom);
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const evChargerResults = useAtomValue(evChargerResultsAtom);
  const selectedEvChargerResult = useAtomValue(selectedEvChargerResultAtom);
  const selectedTripPlaces = useAtomValue(selectedTripPlacesAtom);
  const addEvChargerToBlock = useSetAtom(addEvChargerToBlockAtom);
  const clearEvChargerResults = useSetAtom(clearEvChargerResultsAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const setEvChargerResults = useSetAtom(setEvChargerResultsAtom);

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

  const placeAnchors = useMemo(() => {
    if (activePanel?.type !== "ev-stations") {
      return [];
    }

    return getBlockPlaceAnchors(tripBlocks, activePanel.blockId);
  }, [activePanel, tripBlocks]);

  function addChargerToTrip(blockId: string, charger: EvCharger) {
    addEvChargerToBlock({ blockId, charger });
  }

  if (activePanel?.type !== "ev-stations") {
    return null;
  }

  return (
    <EvStationSidePanel
      activeBlockId={activePanel.blockId}
      placeAnchors={placeAnchors}
      results={evChargerResults}
      selectedResult={selectedEvChargerResult}
      addedChargerIds={addedChargerIds}
      onAddCharger={addChargerToTrip}
      onClose={() => clearEvChargerResults()}
      onSelect={(chargerId) => selectEvCharger(chargerId)}
      onUpdateResults={(results) => setEvChargerResults(results)}
    />
  );
}
