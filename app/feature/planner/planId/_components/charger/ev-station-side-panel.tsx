"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

import { searchEvChargers } from "../constants/charger.data";
import { getDistanceKm } from "../constants/place.data";
import type { EvCharger } from "../constants/types";
import type { EvChargerMapResult } from "../overview/trip-builder.atoms";

import { EvStationDetailCard } from "./ev-station-detail-card";
import { EvStationListCard } from "./ev-station-list-card";
import { getEvStationVisual } from "./ev-station-panel.data";

type PlaceAnchor = {
  id: string;
  lat: number;
  lng: number;
};

type EvStationSidePanelProps = {
  activeBlockId: string | null;
  placeAnchors: PlaceAnchor[];
  results: EvChargerMapResult[];
  selectedResult: EvChargerMapResult | null;
  addedChargerIds: Set<string>;
  onAddCharger: (blockId: string, charger: EvCharger) => void;
  onClose: () => void;
  onSelect: (chargerId: string) => void;
  onUpdateResults: (results: EvChargerMapResult[]) => void;
};

function getPanelBlockId(
  activeBlockId: string | null,
  selectedResult: EvChargerMapResult | null,
  results: EvChargerMapResult[],
): string | null {
  return (
    selectedResult?.targetBlockId ?? results[0]?.targetBlockId ?? activeBlockId
  );
}

function getMinDistanceKm(
  chargerLocation: { lat: number; lng: number },
  anchors: PlaceAnchor[],
): number {
  if (anchors.length === 0) return 0;

  return anchors.reduce((min, anchor) => {
    const d = getDistanceKm(
      { lat: anchor.lat, lng: anchor.lng },
      chargerLocation,
    );
    return d < min ? d : min;
  }, Infinity);
}

function getClosestAnchorId(
  chargerLocation: { lat: number; lng: number },
  anchors: PlaceAnchor[],
): string {
  let bestId = anchors[0]!.id;
  let bestDist = Infinity;

  for (const anchor of anchors) {
    const d = getDistanceKm(
      { lat: anchor.lat, lng: anchor.lng },
      chargerLocation,
    );
    if (d < bestDist) {
      bestDist = d;
      bestId = anchor.id;
    }
  }

  return bestId;
}

export function EvStationSidePanel({
  activeBlockId,
  placeAnchors,
  results,
  selectedResult,
  addedChargerIds,
  onAddCharger,
  onClose,
  onSelect,
  onUpdateResults,
}: EvStationSidePanelProps) {
  const [query, setQuery] = useState("");
  const panelBlockId = getPanelBlockId(activeBlockId, selectedResult, results);
  const selectedCharger =
    selectedResult?.charger ?? results[0]?.charger ?? null;
  const selectedIsAdded = selectedCharger
    ? addedChargerIds.has(selectedCharger.id)
    : false;

  function updateSearch(nextQuery: string) {
    setQuery(nextQuery);

    if (!panelBlockId) {
      return;
    }

    const chargers = searchEvChargers(nextQuery);
    const nextResults = chargers
      .map((charger) => ({
        charger,
        targetBlockId: panelBlockId,
        targetPlaceId:
          placeAnchors.length > 0
            ? getClosestAnchorId(charger.location, placeAnchors)
            : panelBlockId,
        distanceKm: getMinDistanceKm(charger.location, placeAnchors),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    onUpdateResults(nextResults);

    const firstCharger = nextResults[0]?.charger;
    if (firstCharger) {
      onSelect(firstCharger.id);
    }
  }

  function addCharger(charger: EvCharger) {
    if (!panelBlockId) {
      return;
    }

    onAddCharger(panelBlockId, charger);
  }

  return (
    <aside
      className="absolute bottom-0 right-0 top-0 z-20 flex w-full min-w-0 flex-col border-l border-border bg-background/95 text-foreground shadow-2xl backdrop-blur sm:w-[25vw] sm:min-w-80 sm:max-w-[26rem]"
      aria-label="EV station picker"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <div className=" bg-card px-4 py-4">
        <div className="mb-6">
          <p className="text-2xl font-bold leading-tight">
            <span className="text-primary mr-3">EV</span>
            <span className="text-foreground">Charging Station</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search"
              className="h-11 rounded-sm border-transparent bg-background pl-9 shadow-xs"
              aria-label="Search EV stations"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-primary text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Close EV station picker"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <section aria-labelledby="nearby-chargers-title" className="">
          {results.length ? (
            <div className="space-y-3">
              {results.map((result) => {
                const charger = result.charger;
                const isSelected = selectedCharger?.id === charger.id;

                return (
                  <EvStationListCard
                    key={charger.id}
                    charger={charger}
                    visual={getEvStationVisual(charger.id)}
                    distanceKm={result.distanceKm}
                    isAdded={addedChargerIds.has(charger.id)}
                    isSelected={isSelected}
                    onSelect={() => onSelect(charger.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-xs">
              No matching EV stations.
            </div>
          )}
        </section>
      </div>

      {selectedCharger ? (
        <div className="border-t border-border bg-background ">
          <EvStationDetailCard
            charger={selectedCharger}
            distanceKm={selectedResult?.distanceKm}
            isAdded={selectedIsAdded}
            onAdd={() => addCharger(selectedCharger)}
          />
        </div>
      ) : null}
    </aside>
  );
}
