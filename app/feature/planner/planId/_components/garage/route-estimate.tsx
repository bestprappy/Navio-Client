"use client";

import { AlertTriangle } from "lucide-react";
import { useAtomValue } from "jotai";

import { cn } from "@/lib/utils";

import { BatteryRouteChart } from "./battery-route-chart";
import type { DayBatteryPoint } from "./ev-calculator";
import { arrivalReservePctAtom } from "./garage.atoms";
import { SIMULATION_MODEL } from "./simulation-model";
import { BATTERY_TONES, formatDistanceKm, formatMinutes, getBatteryTone } from "./garage-formatters";

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

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

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
  const startPct = clampPct(startBatteryPct);
  const endPct = clampPct(endBatteryPct);
  const startLevel = getBatteryTone(startPct, reservePct);
  const endLevel = getBatteryTone(endPct, reservePct);
  const startTone = BATTERY_TONES[startLevel];
  const endTone = BATTERY_TONES[endLevel];
  const showChart = profile.length >= 2 && (profile.at(-1)?.distanceKm ?? 0) > 0;
  const totalStops = compatibleStops + incompatibleStops;

  // The end-of-day dip is already flagged by the end value; this surfaces one hidden mid-route.
  const lowest = profile.reduce<DayBatteryPoint | null>(
    (min, point) => (!min || point.arrivalPct < min.arrivalPct ? point : min),
    null,
  );
  const midRouteDip =
    lowest && lowest.id !== profile.at(-1)?.id && lowest.arrivalPct < reservePct ? lowest : null;

  return (
    <section aria-label="Route estimate" className="@container/estimate min-w-0 rounded-md bg-card ring-1 ring-border">
      <div className="px-4 pt-3 pb-4">
        <p className="text-sm font-medium text-foreground">Route estimate</p>

        {/* Start on the left, end on the right: the same endpoints as the chart below. */}
        <div className="mt-3 flex items-center gap-3">
          <BatteryFigure value={startPct} className={startTone.valueText} />
          {/* Fades from the start level's color to the end level's: the day's drain at a glance. */}
          <span
            className="h-0.5 flex-1 rounded-full opacity-70"
            style={{ backgroundImage: `linear-gradient(to right, var(--battery-${startLevel}), var(--battery-${endLevel}))` }}
            aria-hidden="true"
          />
          <BatteryFigure value={endPct} className={endTone.valueText} />
        </div>
        <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
          <span>Start of day</span>
          <span className="text-right">
            {endTone.label ? (
              <>
                <span className={cn("font-medium", endTone.text)}>{endTone.label}</span> at end of day
              </>
            ) : (
              "End of day"
            )}
          </span>
        </div>

        {midRouteDip ? (
          <p className="mt-3 flex items-start gap-2 rounded-sm bg-destructive/10 px-2.5 py-2 text-xs leading-relaxed text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Arrives at <span className="font-semibold">{midRouteDip.name}</span> with{" "}
              <span className="font-semibold tabular-nums">{Math.round(midRouteDip.arrivalPct)}%</span>, below your {reservePct}% reserve.
            </span>
          </p>
        ) : null}

        {showChart ? (
          <BatteryRouteChart className="mt-4" points={profile} reservePct={reservePct} />
        ) : (
          <>
            <div
              className="relative mt-4 h-2 rounded-full bg-muted ring-1 ring-border ring-inset"
              role="meter"
              aria-label="Battery at day end"
              aria-valuenow={Math.round(endPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${endPct.toFixed(0)}%${endTone.label ? `, ${endTone.label.toLowerCase()}` : ""}. Reserve ${reservePct}%.`}
            >
              <div className={cn("h-full rounded-full", endTone.fill)} style={{ width: `${endPct}%` }} />
              <div className="absolute -inset-y-0.5 w-px bg-foreground/60" style={{ left: `${reservePct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{reservePct}% reserve</p>
          </>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border px-4 py-3 @min-[28rem]/estimate:grid-cols-4">
        <RouteStat label="Distance" value={formatDistanceKm(distanceKm)} unit="km" />
        <RouteStat label="Driving" value={formatMinutes(drivingMinutes)} />
        <RouteStat
          label="Charging"
          value={chargeMinutes > 0 ? formatMinutes(chargeMinutes) : "None"}
          note={totalStops > 0 ? `${totalStops} stop${totalStops === 1 ? "" : "s"}` : undefined}
        />
        <RouteStat label="Energy needed" value={energyKwh.toFixed(1)} unit="kWh" />
      </dl>

      {incompatibleStops > 0 && (
        <p className="flex items-start gap-1.5 border-t border-border px-4 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {incompatibleStops} charging stop{incompatibleStops === 1 ? " doesn’t" : "s don’t"} match this vehicle’s connector.
          </span>
        </p>
      )}

      <details className="border-t border-border px-4 py-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          How this is estimated
        </summary>
        <p className="mt-1.5 max-w-prose leading-relaxed text-muted-foreground">
          Based on road distance plus a {SIMULATION_MODEL.planningMarginFraction * 100}% energy margin. Charging time
          includes charging losses and slower charging near full; allow {SIMULATION_MODEL.stopOverheadMinutes} extra
          minutes per stop to plug in.
        </p>
      </details>
    </section>
  );
}

function BatteryFigure({ value, className }: { value: number; className: string }) {
  return (
    <span className={cn("text-3xl font-semibold leading-none tracking-tight tabular-nums", className)}>
      {value.toFixed(0)}
      <span className="ml-0.5 text-base font-medium text-muted-foreground">%</span>
    </span>
  );
}

function RouteStat({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base font-semibold leading-tight tabular-nums text-foreground">
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span> : null}
        {note ? <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{note}</span> : null}
      </dd>
    </div>
  );
}
