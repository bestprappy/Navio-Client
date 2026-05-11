"use client";

import { Zap } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { searchEvChargers } from "../constants/charger.data";
import { getDistanceKm } from "../constants/place.data";
import { isEvChargerPlaceItem, isPlaceItem } from "../constants/types";
import { activeEvCarAtom } from "../garage/garage.atoms";
import { isCompatible } from "../garage/ev-calculator";
import {
  activeBlockIdAtom,
  activePlannerSidePanelAtom,
  selectEvChargerAtom,
  setEvChargerResultsAtom,
  tripBlocksAtom,
} from "../overview/trip-builder.atoms";

type AddEvStationButtonProps = {
  blockId: string;
};

export function AddEvStationButton({ blockId }: AddEvStationButtonProps) {
  const blocks = useAtomValue(tripBlocksAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const setActivePlannerSidePanel = useSetAtom(activePlannerSidePanelAtom);
  const setEvChargerResults = useSetAtom(setEvChargerResultsAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const activeEvCar = useAtomValue(activeEvCarAtom);

  const block = blocks.find((b) => b.id === blockId);
  const placeAnchors = (block?.items ?? [])
    .filter(isPlaceItem)
    .filter((item) => !isEvChargerPlaceItem(item));

  const hasPlaces = placeAnchors.length > 0;

  function openStationList() {
    if (!hasPlaces) return;

    const chargers = searchEvChargers("");

    const results = chargers
      .map((charger) => {
        const minDistance = placeAnchors.reduce((min, place) => {
          const d = getDistanceKm(
            { lat: place.lat, lng: place.lng },
            charger.location,
          );
          return d < min ? d : min;
        }, Infinity);

        const closestAnchor = placeAnchors.reduce((best, place) => {
          const d = getDistanceKm(
            { lat: place.lat, lng: place.lng },
            charger.location,
          );
          const bestD = getDistanceKm(
            { lat: best.lat, lng: best.lng },
            charger.location,
          );
          return d < bestD ? place : best;
        });

        return {
          charger,
          targetBlockId: blockId,
          targetPlaceId: closestAnchor.id,
          distanceKm: minDistance === Infinity ? 0 : minDistance,
        };
      })
      .sort((a, b) => {
        const compatibleA = activeEvCar
          ? isCompatible(activeEvCar.connectorTypes, a.charger.connectorTypes)
          : true;
        const compatibleB = activeEvCar
          ? isCompatible(activeEvCar.connectorTypes, b.charger.connectorTypes)
          : true;

        if (compatibleA !== compatibleB) {
          return compatibleA ? -1 : 1;
        }

        return a.distanceKm - b.distanceKm;
      });

    setActiveBlockId(blockId);
    setEvChargerResults(results);
    setActivePlannerSidePanel({ type: "ev-stations", blockId });

    const firstCharger = results[0]?.charger;
    if (firstCharger) {
      selectEvCharger(firstCharger.id);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={!hasPlaces}
      title={
        hasPlaces
          ? undefined
          : "Add at least one place to this day before searching for EV stations"
      }
      className="min-w-40 flex-1 rounded-sm border-primary/30 bg-primary/10 py-6 text-primary hover:border-primary/50 hover:bg-primary/15 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary/40 dark:bg-primary/15 dark:hover:bg-primary/25"
      onClick={openStationList}
    >
      <Zap className="size-4" aria-hidden="true" />
      Add EV station
    </Button>
  );
}
