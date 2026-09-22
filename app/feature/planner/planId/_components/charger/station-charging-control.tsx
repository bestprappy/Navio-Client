"use client";

import { useId } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PlaceItemEvChargerDetails } from "../constants/types";
import type { EvCar } from "../constants/vehicle.types";
import { getBatteryColor } from "../garage/battery-slider";
import { calculationEvCarAtom } from "../garage/garage.atoms";
import { normalizeStationTargetPct, projectChargingStop, type ChargingStopProjection } from "../garage/ev-calculator";
import { formatMinutes } from "../garage/garage-formatters";
import { updatePlaceItemAtom } from "../overview/trip-builder.atoms";
import { ChargeBar } from "../routes/charge-segment-info";
import { SpecCell } from "./spec-cell";

const QUICK_TARGETS = [60, 80, 100] as const;

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
  const car = useAtomValue(calculationEvCarAtom);
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const projection = car && arrivalPct !== undefined ? projectChargingStop(arrivalPct, details, car) : null;
  const target = normalizeStationTargetPct(details.targetBatteryPct ?? projection?.departurePct);
  const arrival = projection ? Math.round(projection.arrivalPct) : 0;

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
    <div
      data-no-drag
      className="min-w-0 space-y-3"
      onClick={(event) => event.stopPropagation()}
      onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor={inputId} className="text-sm text-muted-foreground">Charge to</label>
          <p className="mt-1 font-mono text-2xl leading-none font-semibold tabular-nums text-foreground" aria-hidden="true">
            {target}
            <span className="text-base text-muted-foreground">%</span>
          </p>
        </div>
        <div role="group" aria-label="Quick charge targets" className="segmented-track inline-flex gap-0.5 rounded-full p-1">
          {QUICK_TARGETS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={target === value}
              onClick={() => updateTarget(value)}
              className={cn(
                "h-7 min-w-12 rounded-full px-3 font-mono text-xs font-medium tabular-nums outline-none transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                target === value
                  ? "segmented-thumb text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}%
            </button>
          ))}
        </div>
      </div>

      {/* Visual track: the dimmed part is the battery on arrival, the lit part is what this stop adds. */}
      <div className="relative h-7 rounded-md has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-2.5 inset-y-0">
          <ChargeBar from={arrival} to={target} className="absolute inset-x-0 top-1/2 -translate-y-1/2" />
          {/* Same thumb as the garage's starting battery slider: level-colored circle with a light center dot. */}
          <span
            className="absolute top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-[background-color] duration-100"
            style={{ left: `${target}%`, backgroundColor: getBatteryColor(target) }}
          >
            <span className="rounded-full bg-primary-foreground/70" style={{ width: 7, height: 7 }} />
          </span>
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
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <div id={helpId}>
        <ChargeEstimate car={car} projection={projection} target={target} />
      </div>
    </div>
  );
}

function ChargeEstimate({ car, projection, target }: { car: EvCar | null; projection: ChargingStopProjection | null; target: number }) {
  if (!car) {
    return <p className="text-sm text-muted-foreground">Charging time needs a vehicle with a supported consumption estimate. You can still set the charging target.</p>;
  }
  if (!projection) {
    return <p className="text-sm text-muted-foreground">Charging time appears once the route is ready.</p>;
  }
  if (!projection.compatible) {
    return (
      <p className="flex items-start gap-2 text-sm font-medium text-warning">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        None of this station&apos;s plugs fit your EV.
      </p>
    );
  }
  const arrival = Math.round(projection.arrivalPct);
  if (target <= arrival) {
    return <p className="text-sm text-muted-foreground">You arrive with {arrival}%, already at or above this target.</p>;
  }
  return (
    <dl className="surface-well grid grid-cols-3 gap-px overflow-hidden rounded-md bg-border/60">
      <SpecCell label="Arrive at" value={String(arrival)} unit="%" />
      <SpecCell label="Adds" value={projection.chargeEnergyKwh.toFixed(1)} unit="kWh" />
      <SpecCell label="Takes" value={formatMinutes(projection.chargeMinutes)} />
    </dl>
  );
}
