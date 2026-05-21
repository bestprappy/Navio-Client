"use client";

import { Zap } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { getDistanceKm } from "../constants/place.data";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type EvCharger,
} from "../constants/types";
import { activeEvCarAtom } from "../garage/garage.atoms";
import { isCompatible } from "../garage/ev-calculator";
import {
  activeBlockIdAtom,
  activePlannerSidePanelAtom,
  evChargerErrorAtom,
  evChargerLoadingAtom,
  selectEvChargerAtom,
  setEvChargerResultsAtom,
  tripBlocksAtom,
  type EvChargerMapResult,
} from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import {
  DEFAULT_EV_STATION_RADIUS_METERS,
  fetchEvChargersNear,
  sampleRoutePolyline,
} from "./ev-station-api";

type AddEvStationButtonProps = {
  blockId: string;
  fallbackAnchor?: EvStationSearchAnchor;
};

export type EvStationSearchAnchor = {
  id: string;
  lat: number;
  lng: number;
};

export function AddEvStationButton({
  blockId,
  fallbackAnchor,
}: AddEvStationButtonProps) {
  const blocks = useAtomValue(tripBlocksAtom);
  const isLoadingEvChargers = useAtomValue(evChargerLoadingAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const setActivePlannerSidePanel = useSetAtom(activePlannerSidePanelAtom);
  const setEvChargerError = useSetAtom(evChargerErrorAtom);
  const setEvChargerLoading = useSetAtom(evChargerLoadingAtom);
  const setEvChargerResults = useSetAtom(setEvChargerResultsAtom);
  const selectEvCharger = useSetAtom(selectEvChargerAtom);
  const activeEvCar = useAtomValue(activeEvCarAtom);

  const tripRoutes = useTripRoutes();
  const routeSegments = tripRoutes.data?.segments ?? [];
  const block = blocks.find((b) => b.id === blockId);
  const placeAnchors = (block?.items ?? [])
    .filter(isPlaceItem)
    .filter((item) => !isEvChargerPlaceItem(item));

  const fallbackAnchors = placeAnchors.length === 0 && fallbackAnchor
    ? [fallbackAnchor]
    : [];
  const searchAnchors = [...placeAnchors, ...fallbackAnchors];
  const canSearch = searchAnchors.length > 0;

  async function openStationList() {
    if (!canSearch) return;

    setActiveBlockId(blockId);
    setEvChargerResults([]);
    setEvChargerError(null);
    setEvChargerLoading(true);
    setActivePlannerSidePanel({ type: "ev-stations", blockId });

    try {
      const intermediateAnchors = sampleRoutePolyline(routeSegments, blockId, 30);
      const allAnchors = [...searchAnchors, ...intermediateAnchors];

      const chargersByAnchor = await Promise.all(
        allAnchors.map(async (anchor) => ({
          place: anchor,
          chargers: await fetchEvChargersNear(
            anchor.lat,
            anchor.lng,
            DEFAULT_EV_STATION_RADIUS_METERS,
          ),
        })),
      );

      const results = buildEvChargerResults(chargersByAnchor, blockId).sort(
        (a, b) => {
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
        },
      );

      setEvChargerResults(results);

      const firstCharger = results[0]?.charger;
      if (firstCharger) {
        selectEvCharger(firstCharger.id);
      } else {
        setEvChargerError("No EV stations found near this block yet.");
      }
    } catch (error) {
      console.error("EV station search failed.", {
        component: "AddEvStationButton",
        operation: "openStationList",
        blockId,
        error,
      });
      setEvChargerError("EV stations could not be loaded.");
    } finally {
      setEvChargerLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={!canSearch || isLoadingEvChargers}
      title={
        canSearch
          ? undefined
          : "Add a place or choose a destination before searching for EV stations"
      }
      className="min-w-40 flex-1 rounded-sm border-primary/30 bg-primary/10 py-6 text-primary hover:border-primary/50 hover:bg-primary/15 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary/40 dark:bg-primary/15 dark:hover:bg-primary/25"
      onClick={openStationList}
    >
      <Zap className="size-4" aria-hidden="true" />
      {isLoadingEvChargers ? "Finding EV stations..." : "Add EV station"}
    </Button>
  );
}

function buildEvChargerResults(
  chargersByAnchor: Array<{
    place: { id: string; lat: number; lng: number };
    chargers: EvCharger[];
  }>,
  blockId: string,
): EvChargerMapResult[] {
  const byChargerId = new Map<string, EvChargerMapResult>();

  chargersByAnchor.forEach(({ place, chargers }) => {
    chargers.forEach((charger) => {
      const distanceKm = getDistanceKm(
        { lat: place.lat, lng: place.lng },
        charger.location,
      );
      const nextResult = {
        charger,
        targetBlockId: blockId,
        targetPlaceId: place.id,
        distanceKm,
      };
      const existing = byChargerId.get(charger.id);

      if (!existing || distanceKm < existing.distanceKm) {
        byChargerId.set(charger.id, nextResult);
      }
    });
  });

  return [...byChargerId.values()];
}
