"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { Checkbox } from "@/components/ui/checkbox";

import { Input } from "@/components/ui/input";

import { PlannerSidePanel } from "../layout/planner-side-panel";
import type { EvCharger } from "../constants/types";
import {
  compatibleChargersOnlyAtom,
  evChargerLoadingAtom,
  selectedEvChargerInsertionAtom,
  tripBlocksAtom,
  type EvChargerMapResult,
} from "../overview/trip-builder.atoms";
import {
  activeEvCarAtom,
  activeVehicleAtom,
  startingBatteryPctAtom,
} from "../garage/garage.atoms";
import {
  isCompatible,
} from "../garage/ev-calculator";
import { useTripCharging } from "../garage/use-trip-charging";

import { EvStationListCard } from "./ev-station-list-card";
import { getItemInsertionIndex } from "../block/item-insertion";
import { EvRouteOptimizationPanel } from "./ev-route-optimization-panel";
import { PlannerSectionTips } from "../tour/planner-section-tips";
import { PLANNER_CHARGING_TOUR } from "../tour/data";

const CHARGING_SECTION_TOURS = [PLANNER_CHARGING_TOUR];
import { filterEvChargers } from "./ev-station-api";

type EvStationSidePanelProps = {
  activeBlockId: string | null;
  results: EvChargerMapResult[];
  selectedResult: EvChargerMapResult | null;
  addedChargerIds: Set<string>;
  onAddCharger: (blockId: string, charger: EvCharger, beforeItemId?: string) => void;
  onClose: () => void;
  onSelect: (chargerId: string) => void;
};

function getPanelBlockId(
  activeBlockId: string | null,
  selectedResult: EvChargerMapResult | null,
  results: EvChargerMapResult[],
): string | null {
  return (
    activeBlockId ?? selectedResult?.targetBlockId ?? results[0]?.targetBlockId
  );
}

export function EvStationSidePanel({
  activeBlockId,
  results,
  selectedResult,
  addedChargerIds,
  onAddCharger,
  onClose,
  onSelect,
}: EvStationSidePanelProps) {
  const [query, setQuery] = useState("");
  const [compatibleOnly, setCompatibleOnly] = useAtom(compatibleChargersOnlyAtom);
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const activeVehicle = useAtomValue(activeVehicleAtom);
  const isLoadingEvChargers = useAtomValue(evChargerLoadingAtom);
  const blocks = useAtomValue(tripBlocksAtom);
  const insertion = useAtomValue(selectedEvChargerInsertionAtom);
  const startingBatteryPct = useAtomValue(startingBatteryPctAtom);
  const panelBlockId = getPanelBlockId(activeBlockId, selectedResult, results);
  const tripCharging = useTripCharging();
  // Later days start with whatever the earlier days left in the battery.
  const dayStartBatteryPct = panelBlockId
    ? tripCharging?.days.get(panelBlockId)?.startBatteryPct ?? startingBatteryPct
    : startingBatteryPct;
  const selectedCharger =
    selectedResult?.charger ?? results[0]?.charger ?? null;
  const visibleResults = useMemo(() => {
    const visibleChargerIds = new Set(
      filterEvChargers(
        results.map((result) => result.charger),
        query,
      ).map((charger) => charger.id),
    );

    return results.filter((result) => visibleChargerIds.has(result.charger.id));
  }, [query, results]);
  const getVehicleCompatibility = (charger: EvCharger) =>
    activeEvCar
      ? isCompatible(activeEvCar.connectorTypes, charger.connectorTypes)
      : true;

  function updateSearch(nextQuery: string) {
    setQuery(nextQuery);

    const nextVisible = filterEvChargers(
      results.map((result) => result.charger),
      nextQuery,
    );
    const firstCharger = nextVisible[0];
    if (firstCharger) {
      onSelect(firstCharger.id);
    }
  }



  function addCharger(result: EvChargerMapResult) {
    onAddCharger(result.targetBlockId, result.charger, result.beforeItemId);
  }

  return (
    <PlannerSidePanel.Root
      open
      resizable
      title={
        <>
          <span className="mr-2 text-primary">EV</span>
          <span>Charging Station</span>
        </>
      }
      ariaLabel="EV station picker"
      onBack={onClose}
    >
      <PlannerSidePanel.Header>
        <PlannerSectionTips section="EV charging" tours={CHARGING_SECTION_TOURS} />
      </PlannerSidePanel.Header>

      <PlannerSidePanel.Body>
        <div className="border-b border-border bg-card px-4 py-4">
          {insertion.label || insertion.error && selectedResult ? <p className="mb-3 text-xs text-muted-foreground">{insertion.error ?? insertion.label}</p> : null}
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

          <div className="mt-3 rounded-md bg-primary/5 p-4 ring-1 ring-primary/15" data-tour="planner.ev-preferences">
            <EvRouteOptimizationPanel
              blockId={panelBlockId}
              vehicle={activeEvCar}
              startingSocPct={dayStartBatteryPct}
            />
          </div>
        </div>

        <section aria-label="Nearby EV stations" className="px-4 py-4" data-tour="planner.ev-stations">
          <label className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={compatibleOnly} onCheckedChange={setCompatibleOnly} />
            Show only compatible
          </label>
          {compatibleOnly && !activeVehicle && <p className="mb-3 text-sm text-muted-foreground">Select a vehicle in your garage to find compatible stations.</p>}
          {isLoadingEvChargers ? (
            <div className="rounded-sm border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-xs">
              Finding EV stations near this block...
            </div>
          ) : visibleResults.length ? (
            <div className="space-y-3">
              {visibleResults.map((result) => {
                const charger = result.charger;
                const isSelected = selectedCharger?.id === charger.id;

                return (
                  <EvStationListCard
                    key={charger.id}
                    charger={charger}
                    distanceKm={result.distanceKm}
                    isAdded={addedChargerIds.has(charger.id)}
                    canAdd={blocks.some((block) => block.id === result.targetBlockId && getItemInsertionIndex(block, result.beforeItemId) >= 0)}
                    isCompatible={getVehicleCompatibility(charger)}
                    isSelected={isSelected}
                    onAdd={() => addCharger(result)}
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
      </PlannerSidePanel.Body>
    </PlannerSidePanel.Root>
  );
}
