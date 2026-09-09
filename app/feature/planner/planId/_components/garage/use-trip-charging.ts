"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import { getTripRouteGroups } from "../routes/trip-route.helpers";
import { activeEvCarAtom, startingBatteryPctAtom } from "./garage.atoms";
import { projectTripCharging } from "./ev-calculator";

export function useTripCharging() {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const car = useAtomValue(activeEvCarAtom);
  const startingBatteryPct = useAtomValue(startingBatteryPctAtom);
  const { data } = useTripRoutes();
  return useMemo(() => {
    if (!car || !data) return null;
    const complete = getTripRouteGroups(blocks).every((group) =>
      group.points.slice(1).every((point, index) =>
        data.segments.some((segment) =>
          segment.blockId === group.blockId &&
          segment.fromItemId === group.points[index].id &&
          segment.toItemId === point.id &&
          segment.distanceMeters != null,
        ),
      ),
    );
    return complete ? projectTripCharging(blocks, data.segments, car, startingBatteryPct) : null;
  }, [blocks, car, data, startingBatteryPct]);
}
