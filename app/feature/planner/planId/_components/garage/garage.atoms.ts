import { atom } from "jotai";

import { getVehicleCar } from "../constants/vehicle.data";
import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import { AUTO_CHARGE_TARGET_DEFAULT_PCT, normalizeChargeTargetPct } from "./ev-calculator";

// Read-only projection of TanStack Query data for existing planner calculations.
// GarageProvider is the only writer; mutations always go through the API.
export const garageVehiclesSnapshotAtom = atom<UserVehicle[]>([]);
export const garageActiveIdSnapshotAtom = atom<string | null>(null);
export const userVehiclesAtom = atom((get) => get(garageVehiclesSnapshotAtom));
export const activeVehicleIdAtom = atom((get) => get(garageActiveIdSnapshotAtom));
export const garageModalOpenAtom = atom(false);
export const chargeStopTargetPctAtom = atom(AUTO_CHARGE_TARGET_DEFAULT_PCT);
export const activeVehicleAtom = atom((get) =>
  get(userVehiclesAtom).find((vehicle) => vehicle.id === get(activeVehicleIdAtom)) ?? null,
);
export const startingBatteryPctAtom = atom((get) => get(activeVehicleAtom)?.startingBatteryPct ?? 80);
export const activeEvCarAtom = atom<EvCar | null>((get) => {
  const vehicle = get(activeVehicleAtom);
  const car = vehicle ? getVehicleCar(vehicle) : null;
  return car && car.consumptionKwhPer100km > 0 ? car : null;
});
export const setChargeStopTargetPctAtom = atom(null, (_get, set, pct: number) => {
  set(chargeStopTargetPctAtom, normalizeChargeTargetPct(pct));
});
