"use client";

import { Zap } from "lucide-react";
import { useAtomValue, useSetAtom, useStore } from "jotai";

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
  plannerReadOnlyAtom,
  selectEvChargerAtom,
  setEvChargerResultsAtom,
  tripBlocksAtom,
  type EvChargerMapResult,
} from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import { getItemInsertionIndex } from "../block/item-insertion";
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

export function useEvStationSearch({
  blockId,
  fallbackAnchor,
}: AddEvStationButtonProps) {
  const store = useStore();
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

  async function openStationList(beforeItemId?: string) {
    if (!canSearch || !block || store.get(plannerReadOnlyAtom)) return;
    const index = getItemInsertionIndex(block, beforeItemId);
    if (index < 0) return;
    const requestId = crypto.randomUUID();
    const isCurrentRequest = () => store.get(activePlannerSidePanelAtom)?.requestId === requestId;
    const nearestPlaces = beforeItemId === undefined ? searchAnchors : [
      block.items.slice(0, index).findLast((item) => isPlaceItem(item) && !isEvChargerPlaceItem(item)),
      block.items.slice(index).find((item) => isPlaceItem(item) && !isEvChargerPlaceItem(item)),
    ].filter((item) => item !== undefined && isPlaceItem(item));
    const localAnchors = nearestPlaces.length ? nearestPlaces : fallbackAnchors;

    setActiveBlockId(blockId);
    setEvChargerResults([]);
    setEvChargerError(null);
    setEvChargerLoading(true);
    setActivePlannerSidePanel({ type: "ev-stations", blockId, beforeItemId, requestId });

    try {
      const nextPlace = beforeItemId === undefined ? undefined : block.items.slice(index).find(isPlaceItem);
      const localSegments = beforeItemId === undefined ? routeSegments : routeSegments.filter((segment) => segment.toItemId === nextPlace?.id);
      const intermediateAnchors = sampleRoutePolyline(localSegments, blockId, 30);
      const allAnchors = [...localAnchors, ...intermediateAnchors];

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

      if (!isCurrentRequest()) return;
      const results = buildEvChargerResults(chargersByAnchor, blockId, beforeItemId).sort(
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
      if (!isCurrentRequest()) return;
      console.error("EV station search failed.", {
        component: "AddEvStationButton",
        operation: "openStationList",
        blockId,
        error,
      });
      setEvChargerError("EV stations could not be loaded.");
    } finally {
      if (isCurrentRequest()) setEvChargerLoading(false);
    }
  }

  return { canSearch, isLoadingEvChargers, openStationList };
}

export function AddEvStationButton(props: AddEvStationButtonProps) {
  const { canSearch, isLoadingEvChargers, openStationList } = useEvStationSearch(props);
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
      className="h-11 min-w-0 w-full rounded-lg border-charging/30 bg-charging/10 text-charging hover:bg-charging/20 hover:text-charging dark:border-charging/30 dark:bg-charging/10 dark:hover:bg-charging/20 disabled:cursor-not-allowed"
      onClick={() => void openStationList()}
    >
      <Zap className="size-4" aria-hidden="true" />
      <span className="whitespace-normal">
        {isLoadingEvChargers ? "Finding EV stations..." : "Add EV station"}
      </span>
    </Button>
  );
}

function buildEvChargerResults(
  chargersByAnchor: Array<{
    place: { id: string; lat: number; lng: number };
    chargers: EvCharger[];
  }>,
  blockId: string,
  beforeItemId?: string,
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
        beforeItemId,
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
