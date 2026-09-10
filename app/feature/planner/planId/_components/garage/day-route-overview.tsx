"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  AlertTriangle,
  BatteryWarning,
  Loader2,
  MapPin,
  PlugZap,
  Timer,
  Zap,
} from "lucide-react";
import { useAtomValue } from "jotai";

import { cn } from "@/lib/utils";

import { useTripRoutes } from "../routes/trip-route-query";
import { activeEvCarAtom } from "./garage.atoms";
import { calcDayRouteStats } from "./ev-calculator";
import { useTripCharging } from "./use-trip-charging";
import { formatMinutes } from "./garage-formatters";

type DayRouteOverviewProps = {
  blockId: string;
  blockIndex: number;
};

export function DayRouteOverview({ blockId, blockIndex }: DayRouteOverviewProps) {
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const charging = useTripCharging();
  const chargeStats = charging?.days.get(blockId);
  const batteryAtDayStart = chargeStats?.startBatteryPct ?? 0;
  const { data: routeData, isLoading, isError } = useTripRoutes();

  const daySegments = useMemo(
    () => routeData?.segments.filter((s) => s.blockId === blockId) ?? [],
    [routeData, blockId],
  );

  if (!activeEvCar) return null;

  const hasRouteableBlock = daySegments.length > 0;

  if (isLoading) {
    return (
      <div className="ml-8 mt-4">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Calculating day overview...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ml-8 mt-4">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
          <span>Route estimate unavailable.</span>
        </div>
      </div>
    );
  }

  if (!hasRouteableBlock || !chargeStats) return null;

  const dayStats = calcDayRouteStats(daySegments, activeEvCar);
  const batteryEndPct = chargeStats.finalBatteryPct;

  const batteryLow = batteryEndPct < 20;
  const hasIncompatibleStops = chargeStats.incompatibleStops > 0;
  const distanceKm = dayStats.totalDistanceKm;
  const drivingMinutes = Math.round(dayStats.totalDrivingSeconds / 60);

  return (
    <div className="ml-8 mt-4" aria-label={`Day ${blockIndex + 1} route overview`}>
      <div className="rounded-sm border border-border bg-card/80 p-3 shadow-xs">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Route Estimate
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Start {batteryAtDayStart.toFixed(0)}%
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <StatPill
            icon={<MapPin className="size-3.5" />}
            label={`${distanceKm.toFixed(1)} km`}
            aria="Distance"
          />
          <StatPill
            icon={<Timer className="size-3.5" />}
            label={formatMinutes(drivingMinutes)}
            aria="Driving time"
          />
          <StatPill
            icon={<Zap className="size-3.5" />}
            label={`${dayStats.energyKwh.toFixed(1)} kWh`}
            aria="Energy used"
          />
          {chargeStats.chargeMinutes > 0 && (
            <StatPill
              icon={<PlugZap className="size-3.5 text-primary" />}
              label={`Charge ${formatMinutes(chargeStats.chargeMinutes)}`}
              aria="Charge time"
              highlight
            />
          )}
          {chargeStats.compatibleStops > 0 && (
            <StatPill
              icon={<PlugZap className="size-3.5" />}
              label={`${chargeStats.compatibleStops} compatible stop${
                chargeStats.compatibleStops === 1 ? "" : "s"
              }`}
              aria="Compatible charge stops"
            />
          )}
        </div>
        {hasIncompatibleStops && (
          <div className="mt-3 flex items-start gap-2 rounded-sm bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {chargeStats.incompatibleStops} charger stop
              {chargeStats.incompatibleStops === 1 ? "" : "s"} does not match
              this vehicle connector.
            </span>
          </div>
        )}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Battery at end of day</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                batteryLow ? "text-destructive" : "text-foreground",
              )}
            >
              {batteryEndPct.toFixed(0)}%
              {batteryLow && (
                <BatteryWarning
                  className="ml-1 inline size-3.5 text-destructive"
                  aria-hidden="true"
                />
              )}
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Battery remaining: ${batteryEndPct.toFixed(0)}%`}
            aria-valuenow={Math.round(batteryEndPct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                batteryLow
                  ? "bg-destructive"
                  : batteryEndPct < 40
                    ? "bg-warning"
                    : "bg-primary",
              )}
              style={{ width: `${Math.min(100, batteryEndPct)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type StatPillProps = {
  icon: ReactNode;
  label: string;
  aria: string;
  highlight?: boolean;
};

function StatPill({ icon, label, aria, highlight }: StatPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        highlight ? "font-semibold text-primary" : "text-muted-foreground",
      )}
      aria-label={aria}
    >
      <span className={highlight ? "text-primary" : "text-muted-foreground"} aria-hidden="true">
        {icon}
      </span>
      {label}
    </div>
  );
}
