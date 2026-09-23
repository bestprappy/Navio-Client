"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import { activeEvCarAtom, startingBatteryPctAtom } from "./garage.atoms";
import { projectCanonicalTrip } from "./trip-energy-projection";

export function useTripCharging() {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const car = useAtomValue(activeEvCarAtom);
  const startingBatteryPct = useAtomValue(startingBatteryPctAtom);
  const { data } = useTripRoutes();
  return useMemo(() => {
    return car ? projectCanonicalTrip(blocks, data?.segments ?? [], car, startingBatteryPct) : null;
  }, [blocks, car, data, startingBatteryPct]);
}
