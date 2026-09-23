import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

import { AUTO_MIN_ARRIVAL_PCT } from "./ev-calculator";
import { BATTERY_TONES, formatMinutes, getBatteryTone } from "./garage-formatters";

type RouteEstimateProps = {
  predictedBelowReserve?: boolean;
  infeasible?: boolean;
  startBatteryPct: number | null;
  endBatteryPct: number | null;
  distanceKm: number | null;
  drivingMinutes: number | null;
  energyKwh: number | null;
  chargeMinutes: number | null;
  compatibleStops: number;
  incompatibleStops: number;
};

export function RouteEstimate({
  predictedBelowReserve, infeasible,
  startBatteryPct,
  endBatteryPct,
  distanceKm,
  drivingMinutes,
  energyKwh,
  chargeMinutes,
  compatibleStops,
  incompatibleStops,
}: RouteEstimateProps) {
  const endPct = endBatteryPct === null ? null : Math.max(0, Math.min(100, endBatteryPct));
  const tone = BATTERY_TONES[getBatteryTone(endPct ?? 100)];

  return (
    <div className="@container/estimate min-w-0 rounded-md bg-card ring-1 ring-border">
      <div className="px-4 pt-3 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">Route estimate</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Starting battery <span className="font-mono tabular-nums text-foreground">{startBatteryPct === null ? "Unavailable" : `${startBatteryPct.toFixed(0)}%`}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Battery at day end</p>
            <p className="mt-1 flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
              {tone.label && <span className={cn("text-xs font-medium", tone.text)}>{tone.label}</span>}
              <span className="font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">
                {endPct === null ? "?" : endPct.toFixed(0)}<span className="text-sm font-normal text-muted-foreground">%</span>
              </span>
            </p>
          </div>
        </div>
        <div
          className="relative mt-3 h-2 rounded-full bg-muted ring-1 ring-border ring-inset"
          role="meter"
          aria-label="Battery at day end"
          aria-valuenow={endPct === null ? undefined : Math.round(endPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${endPct === null ? "?" : endPct.toFixed(0)}%${tone.label ? `, ${tone.label.toLowerCase()}` : ""}. Reserve ${AUTO_MIN_ARRIVAL_PCT}%.`}
        >
          <div className={cn("h-full rounded-full", tone.fill)} style={{ width: `${endPct ?? 0}%` }} />
          <div className="absolute -inset-y-0.5 w-px bg-foreground/60" style={{ left: `${AUTO_MIN_ARRIVAL_PCT}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Reserve {AUTO_MIN_ARRIVAL_PCT}%</p>
      </div>

      {(infeasible || predictedBelowReserve) && <p className="px-4 pb-3 text-sm text-warning">{infeasible ? "A driving leg is predicted infeasible. Later observations do not remove that warning." : "A predicted arrival falls below reserve, even if a later observed battery level is higher."}</p>}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border px-4 py-3 @min-[28rem]/estimate:grid-cols-4">
        <RouteStat label="Distance" value={distanceKm === null ? "Unavailable" : `${distanceKm.toFixed(1)} km`} />
        <RouteStat label="Driving" value={drivingMinutes === null ? "Unavailable" : formatMinutes(drivingMinutes)} />
        <RouteStat label="Energy used" value={energyKwh === null ? "Unavailable" : `${energyKwh.toFixed(1)} kWh`} />
        <RouteStat label="Charging" value={chargeMinutes === null ? "Unavailable" : chargeMinutes > 0 ? formatMinutes(chargeMinutes) : "None planned"} />
      </dl>

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
