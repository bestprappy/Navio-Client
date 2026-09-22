"use client";

import { useId } from "react";
import { useAtomValue } from "jotai";

import { cn } from "@/lib/utils";

import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import type { TripEvSummary } from "./ev-calculator";
import { calcRangeKmForBatteryPct } from "./ev-calculator";
import { arrivalReservePctAtom } from "./garage.atoms";
import { SIMULATION_MODEL } from "./simulation-model";
import { BATTERY_TONES, formatDistanceKm, formatMinutes, getBatteryTone } from "./garage-formatters";

type VehicleUsageOverviewProps = {
  car: EvCar;
  vehicle: UserVehicle;
  tripSummary: TripEvSummary | null;
  totalDrivingMinutes: number;
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
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const hasEstimate = tripSummary !== null;
  const startPct = vehicle.startingBatteryPct;
  const endPct = tripSummary?.finalBatteryPct ?? startPct;
  const rangeLeftKm = Math.round(calcRangeKmForBatteryPct(endPct, car));
  const distanceKm = tripSummary?.totalDistanceKm ?? 0;
  const energyKwh = tripSummary?.totalEnergyKwh ?? 0;
  const chargeMinutes = tripSummary?.totalChargeMinutes ?? 0;
  const tone = BATTERY_TONES[getBatteryTone(endPct, reservePct)];
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
                {endPct}
                <span className="text-xl text-muted-foreground">%</span>
              </span>
              {tone.label && <span className={cn("text-sm font-medium", tone.text)}>{tone.label}</span>}
            </p>
          </div>
          <div className="@min-[20rem]/usage:text-right">
            <p className="text-sm text-muted-foreground">Range left</p>
            <p className="mt-1 font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">
              {rangeLeftKm.toLocaleString("en-US")}
              <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">km</span>
            </p>
          </div>
        </div>
        <BatteryTrack startPct={startPct} endPct={endPct} fillClass={tone.fill} showStart={hasEstimate} />
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-border bg-border @min-[30rem]/usage:grid-cols-4">
        <Stat
          label="Distance"
          value={formatDistanceKm(distanceKm)}
          unit="km"
          note={plannedDays > 1 ? `${formatDistanceKm(distanceKm / plannedDays)} km a day` : undefined}
        />
        <Stat
          label="Planning energy"
          value={energyKwh.toFixed(1)}
          unit="kWh"
          note={`${car.consumptionKwhPer100km} kWh/100 km + ${SIMULATION_MODEL.planningMarginFraction * 100}% margin`}
        />
        <Stat label="Driving" value={formatMinutes(totalDrivingMinutes)} />
        <Stat
          label="Charging"
          value={chargeMinutes > 0 ? formatMinutes(chargeMinutes) : "None"}
          note={chargeMinutes > 0 ? undefined : "No stops planned"}
        />
      </dl>

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
  const reservePct = useAtomValue(arrivalReservePctAtom);
  return (
    <div className="mt-4" aria-hidden="true">
      <div className="relative h-2.5 rounded-full bg-muted ring-1 ring-border ring-inset">
        {showStart && startPct > endPct && (
          <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/15" style={{ width: `${startPct}%` }} />
        )}
        <div className={cn("absolute inset-y-0 left-0 rounded-full", fillClass)} style={{ width: `${endPct}%` }} />
        <div className="absolute -inset-y-1 w-px bg-destructive" style={{ left: `${reservePct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
        <span>Reserve {reservePct}%</span>
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

function DailyBattery({ values, hasEstimate }: { values: number[]; hasEstimate: boolean }) {
  const titleId = useId();
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const scrolls = values.length > 8;

  return (
    <div className="border-t border-border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 id={titleId} className="text-sm font-medium text-foreground">
          Battery at the end of each day
        </h4>
        {hasEstimate && values.length > 0 && (
          <p className="text-xs text-muted-foreground">Red line: {reservePct}% reserve</p>
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
                style={{ bottom: `${reservePct}%` }}
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

function DayBar({ day, value, shortLabel }: { day: number; value: number; shortLabel: boolean }) {
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const tone = BATTERY_TONES[getBatteryTone(value, reservePct)];

  return (
    <li className="flex min-w-0 flex-1 flex-col">
      <span className="sr-only">
        Day {day}: {value}%{tone.label ? `, ${tone.label.toLowerCase()}` : ""}
      </span>
      <div className="relative flex-1" aria-hidden="true">
        <div className="absolute inset-x-0 top-5 bottom-0 flex justify-center">
          <div className="relative h-full w-full max-w-10">
            <span
              className={cn("battery-fill-up absolute inset-x-0 bottom-0 rounded-t-sm", tone.fill)}
              style={{ height: `${Math.max(value, 1)}%` }}
            />
            <span
              className="absolute inset-x-0 text-center font-mono text-xs font-medium tabular-nums text-foreground"
              style={{ bottom: `calc(${value}% + 0.25rem)` }}
            >
              {value}%
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
