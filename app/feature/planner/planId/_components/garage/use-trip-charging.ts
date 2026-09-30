"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import { useTripRoutes } from "../routes/trip-route-query";
import { activeEvCarAtom, startingBatteryPctAtom, arrivalReservePctAtom } from "./garage.atoms";
import { projectCanonicalTrip } from "./trip-energy-projection";

export function useTripCharging() {
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const blocks = useAtomValue(itineraryBlocksAtom);
  const car = useAtomValue(activeEvCarAtom);
  const startingBatteryPct = useAtomValue(startingBatteryPctAtom);
  const { data } = useTripRoutes();
  return useMemo(() => {
    return car ? projectCanonicalTrip(blocks, data?.segments ?? [], car, startingBatteryPct, reservePct) : null;
  }, [blocks, car, data, startingBatteryPct, reservePct]);
}
