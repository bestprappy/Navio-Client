"use client";

import { AlertTriangle } from "lucide-react";
import { useAtomValue } from "jotai";

import { cn } from "@/lib/utils";

import { BatteryRouteChart } from "./battery-route-chart";
import type { DayBatteryPoint } from "./ev-calculator";
import { arrivalReservePctAtom } from "./garage.atoms";
import { SIMULATION_MODEL } from "./simulation-model";
import { BATTERY_TONES, formatMinutes, getBatteryTone } from "./garage-formatters";

type RouteEstimateProps = {
  startBatteryPct: number;
  endBatteryPct: number;
  distanceKm: number;
  drivingMinutes: number;
  energyKwh: number;
  chargeMinutes: number;
  compatibleStops: number;
  incompatibleStops: number;
  /** Stops in driving order; when it covers some distance, a chart replaces the end-of-day bar. */
  profile?: DayBatteryPoint[];
};

export function RouteEstimate({
  startBatteryPct,
  endBatteryPct,
  distanceKm,
  drivingMinutes,
  energyKwh,
  chargeMinutes,
  compatibleStops,
  incompatibleStops,
  profile = [],
}: RouteEstimateProps) {
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const endPct = Math.max(0, Math.min(100, endBatteryPct));
  const tone = BATTERY_TONES[getBatteryTone(endPct, reservePct)];
  const showChart = profile.length >= 2 && (profile.at(-1)?.distanceKm ?? 0) > 0;

  return (
    <div className="@container/estimate min-w-0 rounded-md bg-card ring-1 ring-border">
      <div className="px-4 pt-3 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">Route estimate</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Starting battery <span className="font-mono tabular-nums text-foreground">{startBatteryPct.toFixed(0)}%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Battery at day end</p>
            <p className="mt-1 flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
              {tone.label && <span className={cn("text-xs font-medium", tone.text)}>{tone.label}</span>}
              <span className="font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">
                {endPct.toFixed(0)}<span className="text-sm font-normal text-muted-foreground">%</span>
              </span>
            </p>
          </div>
        </div>
        {showChart ? (
          <BatteryRouteChart className="mt-4" points={profile} reservePct={reservePct} />
        ) : (
          <>
            <div
              className="relative mt-3 h-2 rounded-full bg-muted ring-1 ring-border ring-inset"
              role="meter"
              aria-label="Battery at day end"
              aria-valuenow={Math.round(endPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${endPct.toFixed(0)}%${tone.label ? `, ${tone.label.toLowerCase()}` : ""}. Reserve ${reservePct}%.`}
            >
              <div className={cn("h-full rounded-full", tone.fill)} style={{ width: `${endPct}%` }} />
              <div className="absolute -inset-y-0.5 w-px bg-foreground/60" style={{ left: `${reservePct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Reserve {reservePct}%</p>
          </>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border px-4 py-3 @min-[28rem]/estimate:grid-cols-4">
        <RouteStat label="Distance" value={`${distanceKm.toFixed(1)} km`} />
        <RouteStat label="Driving" value={formatMinutes(drivingMinutes)} />
        <RouteStat label="Planning energy" value={`${energyKwh.toFixed(1)} kWh`} />
        <RouteStat label="Charging" value={chargeMinutes > 0 ? formatMinutes(chargeMinutes) : "None planned"} />
      </dl>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Distance-based estimate with {SIMULATION_MODEL.planningMarginFraction * 100}% energy margin.
        Charging includes assumed losses and DC taper; allow {SIMULATION_MODEL.stopOverheadMinutes} extra minutes per stop to connect.
      </p>

      {(compatibleStops > 0 || incompatibleStops > 0) && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border px-4 py-2 text-xs">
          {compatibleStops > 0 && (
            <p className="text-muted-foreground">
              <span className="font-mono tabular-nums text-foreground">{compatibleStops}</span> compatible charging stop{compatibleStops === 1 ? "" : "s"}
            </p>
          )}
          {incompatibleStops > 0 && (
            <p className="flex items-start gap-1.5 text-warning">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{incompatibleStops} charging stop{incompatibleStops === 1 ? " does" : "s do"} not match this vehicle’s connector.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RouteStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
