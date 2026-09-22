import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { getVehicleCar } from "../constants/vehicle.data";
import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import { AUTO_CHARGE_TARGET_DEFAULT_PCT, AUTO_MIN_ARRIVAL_PCT, normalizeChargeTargetPct } from "./ev-calculator";

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
/** Battery the driver wants to keep on arrival. A per-browser planning preference, like the charge target. */
export const ARRIVAL_RESERVE_OPTIONS: readonly number[] = [10, 12, 15, 20];
const arrivalReserveStorageAtom = atomWithStorage("navio:arrival-reserve-pct", AUTO_MIN_ARRIVAL_PCT);
export const arrivalReservePctAtom = atom(
  (get) => {
    const stored = get(arrivalReserveStorageAtom);
    // Storage is user-editable; anything unexpected falls back to the shared model reserve.
    return ARRIVAL_RESERVE_OPTIONS.includes(stored) ? stored : AUTO_MIN_ARRIVAL_PCT;
  },
  (_get, set, pct: number) => {
    if (ARRIVAL_RESERVE_OPTIONS.includes(pct)) set(arrivalReserveStorageAtom, pct);
  },
);
export const setChargeStopTargetPctAtom = atom(null, (_get, set, pct: number) => {
  set(chargeStopTargetPctAtom, normalizeChargeTargetPct(pct));
});
