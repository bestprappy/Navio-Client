"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Search, Sparkles } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { PlannerSidePanel } from "../layout/planner-side-panel";
import type { EvCharger } from "../constants/types";
import {
  autoAddEvChargersToBlockAtom,
  evChargerLoadingAtom,
  tripBlocksAtom,
  type EvChargerMapResult,
} from "../overview/trip-builder.atoms";
import {
  activeEvCarAtom,
  chargeStopTargetPctAtom,
  setChargeStopTargetPctAtom,
  startingBatteryPctAtom,
} from "../garage/garage.atoms";
import {
  AUTO_CHARGE_TARGET_MAX_PCT,
  AUTO_CHARGE_TARGET_MIN_PCT,
  isCompatible,
  planAutoEvChargers,
} from "../garage/ev-calculator";
import { BatterySlider } from "../garage/battery-slider";

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
  const [autoMessage, setAutoMessage] = useState<string | null>(null);
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const isLoadingEvChargers = useAtomValue(evChargerLoadingAtom);
  const startingBatteryPct = useAtomValue(startingBatteryPctAtom);
  const chargeStopTargetPct = useAtomValue(chargeStopTargetPctAtom);
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const autoAddEvChargers = useSetAtom(autoAddEvChargersToBlockAtom);
  const setChargeStopTargetPct = useSetAtom(setChargeStopTargetPctAtom);
  const panelBlockId = getPanelBlockId(activeBlockId, selectedResult, results);
  const targetBlock = useMemo(
    () => tripBlocks.find((block) => block.id === panelBlockId) ?? null,
    [panelBlockId, tripBlocks],
  );
  const autoPlan = useMemo(() => {
    if (!targetBlock || !activeEvCar) {
      return null;
    }

    return planAutoEvChargers({
      block: targetBlock,
      car: activeEvCar,
      startingBatteryPct,
      chargeTargetPct: chargeStopTargetPct,
      chargers: results.map((result) => result.charger),
    });
  }, [
    activeEvCar,
    chargeStopTargetPct,
    results,
    startingBatteryPct,
    targetBlock,
  ]);
  const autoPlanMinutes = useMemo(
    () =>
      autoPlan?.insertions.reduce(
        (sum, insertion) => sum + insertion.estimatedChargeMinutes,
        0,
      ) ?? 0,
    [autoPlan],
  );
  const autoAddDisabled =
    !panelBlockId || !activeEvCar || !autoPlan?.insertions.length;
  const autoStatusText =
    autoMessage ??
    (!activeEvCar
      ? "Select an EV from your garage first."
      : autoPlan?.insertions.length
        ? `${autoPlan.insertions.length} stop${autoPlan.insertions.length === 1 ? "" : "s"} ready, about ${autoPlanMinutes} min charging to at least ${chargeStopTargetPct}%.`
        : autoPlan?.message ?? "Open a day with route places to auto-plan.");
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

  function autoAddBestChargers() {
    if (!panelBlockId || !autoPlan?.insertions.length) {
      setAutoMessage(autoPlan?.message ?? "No charger plan is available yet.");
      return;
    }

    autoAddEvChargers({
      blockId: panelBlockId,
      insertions: autoPlan.insertions,
    });
    setAutoMessage(
      `Added ${autoPlan.insertions.length} charger${autoPlan.insertions.length === 1 ? "" : "s"} in route order.`,
    );
  }

  function updateChargeStopTarget(nextPct: number) {
    setChargeStopTargetPct(nextPct);
    setAutoMessage(null);
  }

  function addCharger(result: EvChargerMapResult) {
    onAddCharger(result.targetBlockId, result.charger);
  }

  return (
    <PlannerSidePanel.Root
      open
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
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4">
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={autoAddDisabled}
                className="h-10 flex-1 rounded-sm border-primary/30 bg-background text-primary hover:border-primary/50 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={autoAddBestChargers}
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Auto add chargers
              </Button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {autoStatusText}
            </p>
            <div className="mt-4 border-t border-primary/15 pt-3">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Charging preferences
                  </p>
                  <label
                    htmlFor="charge-stop-target"
                    className="mt-2 flex items-center gap-1.5 text-sm font-medium text-foreground"
                  >
                    Minimum battery threshold
                    <HelpCircle
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    >
                      <title>
                        Auto-added charging stops will leave at least this much battery, unless the next leg needs more.
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
                  ariaLabel="Set minimum battery after charging stops"
                  color="var(--primary)"
                  disabled={!activeEvCar}
                  showLabels={false}
                />
              </div>
            </div>
            <EvRouteOptimizationPanel
              blockId={panelBlockId}
              vehicle={activeEvCar}
              startingSocPct={startingBatteryPct}
              targetSocPct={chargeStopTargetPct}
            />
          </div>
        </div>

        <section aria-label="Nearby EV stations" className="px-4 py-4">
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
