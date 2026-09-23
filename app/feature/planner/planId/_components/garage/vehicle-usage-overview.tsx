"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import type { CanonicalTripSummary } from "./trip-energy-projection";
import { energyModelForCar } from "./trip-energy-projection";
import { AUTO_MIN_ARRIVAL_PCT } from "./ev-calculator";
import { BATTERY_TONES, formatDistanceKm, formatMinutes, getBatteryTone } from "./garage-formatters";

type VehicleUsageOverviewProps = {
  car: EvCar;
  vehicle: Pick<UserVehicle, "startingBatteryPct" | "nickname">;
  tripSummary: CanonicalTripSummary | null;
  totalDrivingMinutes: number | null;
  plannedDays: number;
};

export function VehicleUsageOverview({
  car,
  vehicle,
  tripSummary,
  totalDrivingMinutes,
  plannedDays,
}: VehicleUsageOverviewProps) {
  const titleId = useId();
  const hasEstimate = tripSummary !== null;
  const startPct = vehicle.startingBatteryPct;
  const endPct = tripSummary ? tripSummary.finalBatteryPct : startPct;
  const model = energyModelForCar(car);
  const rangeLeftKm = endPct === null ? null : model.modelKind === "RATED_RANGE" && model.ratedRangeKm ? model.ratedRangeKm * endPct / 100 : model.modelKind === "CONSUMPTION" && model.usableBatteryCapacityKwh && model.consumptionKwhPer100km ? model.usableBatteryCapacityKwh * endPct / model.consumptionKwhPer100km : null;
  const distanceKm = tripSummary?.totalDistanceKm ?? null;
  const energyKwh = tripSummary?.totalEnergyKwh ?? null;
  const chargeMinutes = tripSummary?.totalChargeMinutes ?? null;
  const tone = BATTERY_TONES[getBatteryTone(endPct ?? 100)];
  const displayName = vehicle.nickname?.trim() || `${car.make} ${car.model}`;

  return (
    <section
      aria-labelledby={titleId}
      className="@container/usage min-w-0 overflow-hidden rounded-lg border border-border bg-card"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pt-4">
        <h3 id={titleId} className="text-base font-semibold text-foreground">
          Trip energy
        </h3>
        <p className="min-w-0 truncate text-sm text-muted-foreground">{displayName}</p>
      </header>

      <div className="px-4 pt-3 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {hasEstimate ? "Battery at trip end" : "Starting battery"}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-semibold leading-none tabular-nums text-foreground">
                {endPct === null ? "?" : Math.round(endPct)}
                <span className="text-xl text-muted-foreground">%</span>
              </span>
              {tone.label && <span className={cn("text-sm font-medium", tone.text)}>{tone.label}</span>}
            </p>
          </div>
          <div className="@min-[20rem]/usage:text-right">
            <p className="text-sm text-muted-foreground">Range left</p>
            <p className="mt-1 font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">
              {rangeLeftKm === null ? "?" : Math.round(rangeLeftKm).toLocaleString("en-US")}
              <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">km</span>
            </p>
          </div>
        </div>
        <BatteryTrack startPct={startPct} endPct={endPct ?? 0} fillClass={tone.fill} showStart={hasEstimate} />
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-border bg-border @min-[30rem]/usage:grid-cols-4">
        <Stat
          label="Distance"
          value={distanceKm === null ? "Unavailable" : formatDistanceKm(distanceKm)}
          unit="km"
          note={plannedDays > 1 && distanceKm !== null ? `${formatDistanceKm(distanceKm / plannedDays)} km a day` : undefined}
        />
        <Stat
          label="Energy used"
          value={energyKwh === null ? "Unavailable" : energyKwh.toFixed(1)}
          unit="kWh"
          note={model.modelKind === "RATED_RANGE" ? `Provisional: ${model.ratedRangeKm} km rated range` : model.consumptionKwhPer100km ? `at ${model.consumptionKwhPer100km} kWh/100 km` : "Source unavailable"}
        />
        <Stat label="Driving" value={totalDrivingMinutes === null ? "Unavailable" : formatMinutes(totalDrivingMinutes)} />
        <Stat
          label="Charging"
          value={chargeMinutes === null ? "Unavailable" : chargeMinutes > 0 ? formatMinutes(chargeMinutes) : "None"}
          note={chargeMinutes === null ? "Charging inputs incomplete" : "Nominal estimate"}
        />
      </dl>

      {tripSummary?.provisional && <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Provisional rated-range estimate. Prediction uncertainty is not calibrated.</p>}
      {tripSummary?.infeasible && <p className="px-4 py-3 text-sm text-warning">A predicted driving leg is infeasible. An observed battery level may restore later predictions but does not validate that leg.</p>}
      <DailyBattery values={tripSummary?.batteryByDay ?? []} hasEstimate={hasEstimate} />
    </section>
  );
}

function BatteryTrack({
  startPct,
  endPct,
  fillClass,
  showStart,
}: {
  startPct: number;
  endPct: number;
  fillClass: string;
  showStart: boolean;
}) {
  return (
    <div className="mt-4" aria-hidden="true">
      <div className="relative h-2.5 rounded-full bg-muted ring-1 ring-border ring-inset">
        {showStart && startPct > endPct && (
          <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/15" style={{ width: `${startPct}%` }} />
        )}
        <div className={cn("absolute inset-y-0 left-0 rounded-full", fillClass)} style={{ width: `${endPct}%` }} />
        <div className="absolute -inset-y-1 w-px bg-destructive" style={{ left: `${AUTO_MIN_ARRIVAL_PCT}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
        <span>Reserve {AUTO_MIN_ARRIVAL_PCT}%</span>
        {showStart && <span>Started at {startPct}%</span>}
      </div>
    </div>
  );
}

function Stat({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div className="min-w-0 bg-card px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <span className="font-mono text-lg font-semibold leading-tight tabular-nums text-foreground">{value}</span>
        {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
        {note && <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span>}
      </dd>
    </div>
  );
}

function DailyBattery({ values, hasEstimate }: { values: (number | null)[]; hasEstimate: boolean }) {
  const titleId = useId();
  const scrolls = values.length > 8;

  return (
    <div className="border-t border-border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 id={titleId} className="text-sm font-medium text-foreground">
          Battery at the end of each day
        </h4>
        {hasEstimate && values.length > 0 && (
          <p className="text-xs text-muted-foreground">Red line: {AUTO_MIN_ARRIVAL_PCT}% reserve</p>
        )}
      </div>

      {!hasEstimate || values.length === 0 ? (
        <p className="mt-3 rounded-md bg-muted px-3 py-3 text-sm text-muted-foreground">
          Add at least two stops to a day to see how much battery is left each night.
        </p>
      ) : (
        <div
          className="mt-3 overflow-x-auto rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          tabIndex={scrolls ? 0 : undefined}
          role={scrolls ? "region" : undefined}
          aria-label={scrolls ? "Daily battery chart, scrollable" : undefined}
        >
          <div className="relative h-36" style={{ minWidth: `${values.length * 2.5}rem` }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-5 bottom-6 border-b border-border">
              <div
                className="absolute inset-x-0 border-t border-dashed border-destructive"
                style={{ bottom: `${AUTO_MIN_ARRIVAL_PCT}%` }}
              />
            </div>
            <ol aria-labelledby={titleId} className="relative flex h-full gap-2">
              {values.map((value, index) => (
                <DayBar key={index} day={index + 1} value={value} shortLabel={values.length > 7} />
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function DayBar({ day, value, shortLabel }: { day: number; value: number | null; shortLabel: boolean }) {
  const tone = BATTERY_TONES[getBatteryTone(value ?? 100)];

  return (
    <li className="flex min-w-0 flex-1 flex-col">
      <span className="sr-only">
        Day {day}: {value === null ? "Unavailable" : `${Math.round(value)}%`}{tone.label ? `, ${tone.label.toLowerCase()}` : ""}
      </span>
      <div className="relative flex-1" aria-hidden="true">
        <div className="absolute inset-x-0 top-5 bottom-0 flex justify-center">
          <div className="relative h-full w-full max-w-10">
            <span
              className={cn("battery-fill-up absolute inset-x-0 bottom-0 rounded-t-sm", tone.fill)}
              style={{ height: `${value === null ? 0 : Math.max(value, 0)}%` }}
            />
            <span
              className="absolute inset-x-0 text-center font-mono text-xs font-medium tabular-nums text-foreground"
              style={{ bottom: `calc(${value ?? 0}% + 0.25rem)` }}
            >
              {value === null ? "?" : `${Math.round(value)}%`}
            </span>
          </div>
        </div>
      </div>
      <span aria-hidden="true" className="flex h-6 items-end justify-center text-xs text-muted-foreground">
        {shortLabel ? day : `Day ${day}`}
      </span>
    </li>
  );
}
