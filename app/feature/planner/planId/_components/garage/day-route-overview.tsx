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

import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type PlaceItemEvChargerDetails,
} from "../constants/types";
import { activeEvCarAtom, startingBatteryPctAtom } from "./garage.atoms";
import {
  calcDayChargeStats,
  calcDayRouteStats,
  calcTripEvSummary,
  type DayBlockSummary,
} from "./ev-calculator";
import { formatMinutes } from "./garage-formatters";

type DayRouteOverviewProps = {
  blockId: string;
  blockIndex: number;
};

export function DayRouteOverview({ blockId, blockIndex }: DayRouteOverviewProps) {
  const activeEvCar = useAtomValue(activeEvCarAtom);
  const blocks = useAtomValue(tripBlocksAtom);
  const startingBatteryPct = useAtomValue(startingBatteryPctAtom);
  const { data: routeData, isLoading, isError } = useTripRoutes();

  const daySegments = useMemo(
    () => routeData?.segments.filter((s) => s.blockId === blockId) ?? [],
    [routeData, blockId],
  );

  const chargerItems = useMemo(() => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return [] as PlaceItemEvChargerDetails[];
    return block.items
      .filter(isPlaceItem)
      .filter(isEvChargerPlaceItem)
      .map((item) => item.evCharger)
      .filter((c): c is PlaceItemEvChargerDetails => c !== undefined);
  }, [blocks, blockId]);

  const batteryAtDayStart = useMemo(() => {
    if (!activeEvCar || !routeData) return startingBatteryPct;

    const priorSummaries: DayBlockSummary[] = blocks.slice(0, blockIndex).map((block) => {
      const segments = routeData.segments.filter((s) => s.blockId === block.id);
      const priorChargers = block.items
        .filter(isPlaceItem)
        .filter(isEvChargerPlaceItem)
        .map((item) => item.evCharger)
        .filter((c): c is PlaceItemEvChargerDetails => c !== undefined);

      const routeStats = calcDayRouteStats(segments, activeEvCar);
      const chargeStats = calcDayChargeStats(priorChargers, activeEvCar);

      return {
        distanceKm: routeStats.totalDistanceKm,
        energyKwh: routeStats.energyKwh,
        chargeEnergyKwh: chargeStats.chargeEnergyKwh,
        chargeMinutes: chargeStats.chargeMinutes,
      };
    });

    if (priorSummaries.length === 0) return startingBatteryPct;

    const summary = calcTripEvSummary(priorSummaries, activeEvCar, startingBatteryPct);
    return summary.finalBatteryPct;
  }, [activeEvCar, routeData, blocks, blockIndex, startingBatteryPct]);

  if (!activeEvCar) return null;

  const hasRouteableBlock = daySegments.length > 0;

  if (isLoading) {
    return (
      <div className="mx-8 mt-4 pl-2">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Calculating day overview...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-8 mt-4 pl-2">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
          <span>Route estimate unavailable.</span>
        </div>
      </div>
    );
  }

  if (!hasRouteableBlock) return null;

  const dayStats = calcDayRouteStats(daySegments, activeEvCar);
  const chargeStats = calcDayChargeStats(chargerItems, activeEvCar);
  const batteryEndPct = Math.min(
    100,
    Math.max(
      0,
      batteryAtDayStart -
        dayStats.batteryUsedPct +
        (chargeStats.chargeEnergyKwh / activeEvCar.batteryKwh) * 100,
    ),
  );

  const chargedPct = (chargeStats.chargeEnergyKwh / activeEvCar.batteryKwh) * 100;
  const halfDrivingPct = dayStats.batteryUsedPct / 2;
  const batteryBeforeCharge = Math.max(0, Math.min(100, batteryAtDayStart - halfDrivingPct));
  const batteryAfterCharge = Math.max(0, Math.min(100, batteryBeforeCharge + chargedPct));
  const hasCharging = chargeStats.chargeMinutes > 0 && chargedPct > 0;

  const batteryLow = batteryEndPct < 20;
  const hasIncompatibleStops = chargeStats.incompatibleStops > 0;
  const distanceKm = dayStats.totalDistanceKm;
  const drivingMinutes = Math.round(dayStats.totalDrivingSeconds / 60);

  return (
    <div className="mx-8 mt-4 pl-2" aria-label={`Day ${blockIndex + 1} route overview`}>
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
