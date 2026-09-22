"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Search } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Checkbox } from "@/components/ui/checkbox";

import { Input } from "@/components/ui/input";

import { PlannerSidePanel } from "../layout/planner-side-panel";
import type { EvCharger } from "../constants/types";
import {
  compatibleChargersOnlyAtom,
  evChargerLoadingAtom,
  type EvChargerMapResult,
} from "../overview/trip-builder.atoms";
import {
  activeEvCarAtom,
  activeVehicleAtom,
  chargeStopTargetPctAtom,
  setChargeStopTargetPctAtom,
  startingBatteryPctAtom,
} from "../garage/garage.atoms";
import {
  AUTO_CHARGE_TARGET_MAX_PCT,
  AUTO_CHARGE_TARGET_MIN_PCT,
  isCompatible,
} from "../garage/ev-calculator";
import { ArrivalReserveControl } from "../garage/arrival-reserve-control";
import { BatterySlider } from "../garage/battery-slider";
import { useTripCharging } from "../garage/use-trip-charging";

import { EvStationListCard } from "./ev-station-list-card";
import { EvRouteOptimizationPanel } from "./ev-route-optimization-panel";
import { getEvStationVisual } from "./ev-station-panel.data";
import { filterEvChargers } from "./ev-station-api";

type EvStationSidePanelProps = {
  activeBlockId: string | null;
  results: EvChargerMapResult[];
  selectedResult: EvChargerMapResult | null;
  addedChargerIds: Set<string>;
  onAddCharger: (blockId: string, charger: EvCharger) => void;
  onClose: () => void;
  onSelect: (chargerId: string) => void;
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
  const startingBatteryPct = useAtomValue(startingBatteryPctAtom);
  const chargeStopTargetPct = useAtomValue(chargeStopTargetPctAtom);
  const setChargeStopTargetPct = useSetAtom(setChargeStopTargetPctAtom);
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

  function updateChargeStopTarget(nextPct: number) {
    setChargeStopTargetPct(nextPct);
  }

  function addCharger(result: EvChargerMapResult) {
    onAddCharger(result.targetBlockId, result.charger);
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
      <PlannerSidePanel.Header />

      <PlannerSidePanel.Body>
        <div className="border-b border-border bg-card px-4 py-4">
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

          <div className="mt-3 rounded-sm border border-primary/25 bg-primary/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Charging preferences
            </p>
            <ArrivalReserveControl className="mt-2" disabled={!activeEvCar} />
            <div className="mt-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor="charge-stop-target"
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground"
                  >
                    Charge each stop to
                    <HelpCircle
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    >
                      <title>
                        Each planned stop charges to at least this level, more if the next leg needs it.
                      </title>
                    </HelpCircle>
                  </label>
                </div>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {chargeStopTargetPct}%
                </span>
              </div>
              <div className="mt-2">
                <BatterySlider
                  id="charge-stop-target"
                  value={chargeStopTargetPct}
                  onChange={updateChargeStopTarget}
                  min={AUTO_CHARGE_TARGET_MIN_PCT}
                  max={AUTO_CHARGE_TARGET_MAX_PCT}
                  step={1}
                  ariaLabel="Set how full each planned charging stop charges"
                  color="var(--primary)"
                  disabled={!activeEvCar}
                  showLabels={false}
                />
              </div>
            </div>
            <EvRouteOptimizationPanel
              blockId={panelBlockId}
              vehicle={activeEvCar}
              startingSocPct={dayStartBatteryPct}
              targetSocPct={chargeStopTargetPct}
            />
          </div>
        </div>

        <section aria-label="Nearby EV stations" className="px-4 py-4">
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
                    visual={getEvStationVisual(charger.id)}
                    distanceKm={result.distanceKm}
                    isAdded={addedChargerIds.has(charger.id)}
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
