"use client";

import { useMemo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAtomValue } from "jotai";

import { useTripRoutes } from "../routes/trip-route-query";
import { activeEvCarAtom } from "./garage.atoms";
import { calcDayRouteStats } from "./ev-calculator";
import { useTripCharging } from "./use-trip-charging";
import { RouteEstimate } from "./route-estimate";

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
        <div className="flex items-center gap-2 rounded-md bg-card ring-1 ring-border px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span role="status">Calculating route estimate...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ml-8 mt-4">
        <div className="flex items-center gap-2 rounded-md bg-card ring-1 ring-border px-3 py-2 text-sm text-muted-foreground">
          <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
          <span>Route estimate unavailable.</span>
        </div>
      </div>
    );
  }

  if (!hasRouteableBlock || !chargeStats) return null;

  const dayStats = calcDayRouteStats(daySegments, activeEvCar);
  const batteryEndPct = chargeStats.finalBatteryPct;

  return (
    <section className="ml-8 mt-4" aria-label={`Day ${blockIndex + 1} route overview`}>
      <RouteEstimate
        startBatteryPct={batteryAtDayStart}
        endBatteryPct={batteryEndPct}
        distanceKm={dayStats.totalDistanceKm}
        drivingMinutes={Math.round(dayStats.totalDrivingSeconds / 60)}
        energyKwh={dayStats.energyKwh}
        chargeMinutes={chargeStats.chargeMinutes}
        compatibleStops={chargeStats.compatibleStops}
        incompatibleStops={chargeStats.incompatibleStops}
        profile={chargeStats.profile}
      />
    </section>
  );
}
