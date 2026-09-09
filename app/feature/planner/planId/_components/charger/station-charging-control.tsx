"use client";

import { useId } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { BatteryCharging } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaceItemEvChargerDetails } from "../constants/types";
import { activeEvCarAtom } from "../garage/garage.atoms";
import { normalizeStationTargetPct, projectChargingStop } from "../garage/ev-calculator";
import { updatePlaceItemAtom } from "../overview/trip-builder.atoms";

type StationChargingControlProps = {
  blockId: string;
  itemId: string;
  stationName: string;
  details: PlaceItemEvChargerDetails;
  arrivalPct?: number;
};

export function StationChargingControl({ blockId, itemId, stationName, details, arrivalPct }: StationChargingControlProps) {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const car = useAtomValue(activeEvCarAtom);
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const projection = car && arrivalPct !== undefined ? projectChargingStop(arrivalPct, details, car) : null;
  const target = normalizeStationTargetPct(details.targetBatteryPct ?? projection?.departurePct);

  function updateTarget(value: number) {
    const nextTarget = normalizeStationTargetPct(value);
    const nextDetails = { ...details, targetBatteryPct: nextTarget };
    const nextProjection = car && arrivalPct !== undefined ? projectChargingStop(arrivalPct, nextDetails, car) : null;
    updatePlaceItem({
      blockId,
      itemId,
      updates: { evCharger: { ...nextDetails, estimatedChargeMinutes: nextProjection?.chargeMinutes ?? details.estimatedChargeMinutes } },
    });
  }

  return (
    <div data-no-drag className="min-w-0 space-y-3 rounded-xl border border-primary/35 bg-primary/5 p-3" onClick={(event) => event.stopPropagation()} onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={inputId} className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <BatteryCharging className="size-4 text-primary" aria-hidden="true" />
          Charge to
        </label>
        <span className="text-base font-semibold tabular-nums text-primary">{target}%</span>
      </div>
      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        step={1}
        value={target}
        onChange={(event) => updateTarget(Number(event.target.value))}
        aria-label={`Target battery at ${stationName}`}
        aria-valuetext={`${target} percent`}
        aria-describedby={helpId}
        className="block h-8 w-full min-w-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <div className="flex flex-wrap gap-2">
        {[60, 80, 100].map((value) => (
          <Button key={value} type="button" variant={target === value ? "default" : "outline"} size="sm" className="h-8 flex-1 rounded-lg" aria-pressed={target === value} onClick={() => updateTarget(value)}>
            {value}%
          </Button>
        ))}
      </div>
      <p id={helpId} className="text-xs leading-relaxed text-muted-foreground">
        {!car ? "Add your EV in My garage to estimate charging time."
          : !projection ? "Charging time will appear when the route is ready."
          : !projection.compatible ? "This station’s connectors do not match your EV."
          : target <= projection.arrivalPct ? `Arrival: ${Math.round(projection.arrivalPct)}%. No charging needed for this target.`
          : `Arrival: ${Math.round(projection.arrivalPct)}% · Add ${projection.chargeEnergyKwh.toFixed(1)} kWh · About ${projection.chargeMinutes} min`}
      </p>
    </div>
  );
}
