"use client";

import { useId } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { AlertTriangle, BatteryCharging, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PlaceItemEvChargerDetails } from "../constants/types";
import type { EvCar } from "../constants/vehicle.types";
import { BatteryGauge } from "../garage/battery-gauge";
import { activeEvCarAtom, arrivalReservePctAtom } from "../garage/garage.atoms";
import { normalizeStationTargetPct, projectChargingStop, type ChargingStopProjection } from "../garage/ev-calculator";
import { BATTERY_TONES, formatMinutes, getBatteryTone } from "../garage/garage-formatters";
import { updatePlaceItemAtom } from "../overview/trip-builder.atoms";

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
  const car = useAtomValue(activeEvCarAtom);
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const projection = car && arrivalPct !== undefined ? projectChargingStop(arrivalPct, details, car) : null;
  const target = normalizeStationTargetPct(details.targetBatteryPct ?? projection?.departurePct);
  const arrival = projection ? Math.round(projection.arrivalPct) : null;
  const targetTone = BATTERY_TONES[getBatteryTone(target, reservePct)];

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
          <p className={cn("mt-1 text-3xl leading-none font-semibold tracking-tight tabular-nums", targetTone.valueText)} aria-hidden="true">
            {target}
            <span className="text-base font-medium text-muted-foreground">%</span>
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
                "h-7 min-w-12 rounded-full px-3 text-xs font-semibold tabular-nums outline-none transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                target === value ? "segmented-thumb text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}%
            </button>
          ))}
        </div>
      </div>

      {/* Solid fill: battery on arrival. Stripes: what this stop adds. The knob is the target, dragged with the native range input. */}
      <BatteryGauge
        value={arrival ?? 0}
        chargeTo={target}
        markerPct={target}
        reservePct={reservePct}
        className="rounded-lg has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-card"
      >
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
          className="absolute inset-0 size-full cursor-pointer opacity-0 outline-none"
        />
      </BatteryGauge>

      {arrival !== null && (
        <div className="flex justify-between gap-3 text-xs text-muted-foreground" aria-hidden="true">
          <span>
            Arrive with <span className="font-semibold tabular-nums text-foreground">{arrival}%</span>
          </span>
          <span>
            Leave with <span className="font-semibold tabular-nums text-foreground">{Math.max(target, arrival)}%</span>
          </span>
        </div>
      )}

      <div id={helpId}>
        <ChargeEstimate car={car} projection={projection} target={target} />
      </div>
    </div>
  );
}

function ChargeEstimate({ car, projection, target }: { car: EvCar | null; projection: ChargingStopProjection | null; target: number }) {
  if (!car) {
    return <p className="text-sm text-muted-foreground">Add your EV in My garage to estimate charging time.</p>;
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
    <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-muted/50 px-3 py-2.5">
      <ChargeFact icon={BatteryCharging} iconClass="text-charging" label="Adds" value={projection.chargeEnergyKwh.toFixed(1)} unit="kWh" />
      <ChargeFact icon={Clock} iconClass="text-primary" label="Takes" value={formatMinutes(projection.chargeMinutes)} />
    </dl>
  );
}

function ChargeFact({
  icon: Icon,
  iconClass,
  label,
  value,
  unit,
}: {
  icon: typeof Clock;
  iconClass: string;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-4 shrink-0", iconClass)} aria-hidden="true" />
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-foreground">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </dd>
    </div>
  );
}
