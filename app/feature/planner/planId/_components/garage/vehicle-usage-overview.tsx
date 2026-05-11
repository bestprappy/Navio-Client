"use client";

import type { ReactNode } from "react";
import { BatteryCharging, Gauge, PlugZap, Route, Timer, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import type { TripEvSummary } from "./ev-calculator";
import { formatMinutes } from "./garage-formatters";
import { VehicleMedia } from "./vehicle-media";

function getBatteryBarColor(pct: number): string {
  if (pct <= 20) return "bg-destructive";
  if (pct <= 50) return "bg-warning";
  return "bg-primary";
}

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
  const batteryPct = tripSummary?.finalBatteryPct ?? vehicle.startingBatteryPct;
  const currentRangeKm = Math.round((batteryPct / 100) * car.rangeKm);
  const totalDistanceKm = tripSummary?.totalDistanceKm ?? 0;
  const totalEnergyKwh = tripSummary?.totalEnergyKwh ?? 0;
  const totalChargeMinutes = tripSummary?.totalChargeMinutes ?? 0;
  const dailyBattery = tripSummary?.batteryByDay ?? [];
  const displayName = vehicle.nickname?.trim()
    ? vehicle.nickname
    : `${car.make} ${car.model}`;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="border-b border-border/60 bg-background/50 p-3">
        <VehicleMedia car={car} />
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {car.make} {car.model} ({car.year})
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {vehicle.source === "custom" ? "Custom EV" : "Prebuilt EV"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.1fr]">
          <BatteryPanel batteryPct={batteryPct} currentRangeKm={currentRangeKm} />
          <div className="grid gap-3">
            <MetricTile
              icon={<Zap className="size-4" />}
              label="Consumption"
              value={`${totalEnergyKwh.toFixed(1)} kWh`}
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10"
            />
            <MetricTile
              icon={<Gauge className="size-4" />}
              label="Mileage"
              value={`${totalDistanceKm.toFixed(1)} km`}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
            />
          </div>
        </div>

        <DailyUsageBars values={dailyBattery} plannedDays={plannedDays} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricTile
            icon={<Route className="size-4" />}
            label="Distance"
            value={
              plannedDays > 0
                ? `${(totalDistanceKm / plannedDays).toFixed(1)} km / day`
                : "0 km / day"
            }
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
          <MetricTile
            icon={<BatteryCharging className="size-4" />}
            label="Charging Time"
            value={totalChargeMinutes > 0 ? formatMinutes(totalChargeMinutes) : "No stops"}
            iconColor="text-orange-500"
            iconBg="bg-orange-500/10"
          />
          <MetricTile
            icon={<PlugZap className="size-4" />}
            label="Connector"
            value={car.connectorTypes.join(", ")}
            iconColor="text-purple-500"
            iconBg="bg-purple-500/10"
          />
          <MetricTile
            icon={<Timer className="size-4" />}
            label="Driving Time"
            value={formatMinutes(totalDrivingMinutes)}
            iconColor="text-cyan-500"
            iconBg="bg-cyan-500/10"
          />
        </div>
      </div>
    </div>
  );
}

function BatteryPanel({
  batteryPct,
  currentRangeKm,
}: {
  batteryPct: number;
  currentRangeKm: number;
}) {
  const filledBars = Math.ceil(batteryPct / 12.5);

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-background/70 p-3">
      <div className="flex flex-1 gap-3">
        <div className="flex w-20 flex-col-reverse gap-1.5">
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "flex-1 rounded-full",
                index < filledBars ? getBatteryBarColor(batteryPct) : "bg-muted",
              )}
            />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Battery</p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {batteryPct}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Range</p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {currentRangeKm} km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyUsageBars({
  values,
  plannedDays,
}: {
  values: number[];
  plannedDays: number;
}) {
  const barValues =
    values.length > 0
      ? values
      : Array.from({ length: Math.max(plannedDays, 1) }).map(() => 0);

  const count = barValues.length;
  const gapClass = count > 14 ? "gap-0.5" : count > 7 ? "gap-1" : "gap-2";
  const padClass = count > 14 ? "px-0.5 pb-0.5" : "px-1 pb-1";

  return (
    <div className="rounded-md border border-border bg-background/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Vehicle Usage</p>
          <p className="text-xs text-muted-foreground">Battery after each day</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
          Trip
        </span>
      </div>
      <div className={cn("flex h-24 items-end pb-1", gapClass)}>
        {barValues.map((value, index) => {
          const height = Math.max(12, value);
          const isEmpty = values.length === 0;

          return (
            <div
              key={`${index}-${value}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <div className={cn("flex h-20 w-full items-end rounded-sm bg-muted/60", padClass)}>
                <span
                  className={cn(
                    "block w-full rounded-sm transition-all",
                    isEmpty ? "bg-border" : getBatteryBarColor(value),
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">
                D{index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background/70 p-3">
      <div className={cn("mb-2 flex items-center gap-2", iconColor)}>
        <span
          className={cn("flex size-7 items-center justify-center rounded-full", iconBg)}
          aria-hidden="true"
        >
          {icon}
        </span>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="break-words text-lg font-bold leading-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
