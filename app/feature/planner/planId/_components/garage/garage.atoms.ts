import { atom } from "jotai";

import { getVehicleCar } from "../constants/vehicle.data";
import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import { AUTO_CHARGE_TARGET_DEFAULT_PCT, normalizeChargeTargetPct } from "./ev-calculator";

// Read-only projection of TanStack Query data for existing planner calculations.
// GarageProvider is the only writer; mutations always go through the API.
export const garageVehiclesSnapshotAtom = atom<UserVehicle[]>([]);
export const garageActiveIdSnapshotAtom = atom<string | null>(null);
// Immediate trip-only battery state; server refreshes must not undo a slider gesture.
export const startingBatteryOverridesAtom = atom<Record<string, number>>({});
export const userVehiclesAtom = atom((get) => {
  const overrides = get(startingBatteryOverridesAtom);
  return get(garageVehiclesSnapshotAtom).map((vehicle) => overrides[vehicle.id] === undefined
    ? vehicle : { ...vehicle, startingBatteryPct: overrides[vehicle.id] });
});
export const activeVehicleIdAtom = atom((get) => get(garageActiveIdSnapshotAtom));
export const garageModalOpenAtom = atom(false);
export const chargeStopTargetPctAtom = atom(AUTO_CHARGE_TARGET_DEFAULT_PCT);
export const activeVehicleAtom = atom((get) =>
  get(userVehiclesAtom).find((vehicle) => vehicle.id === get(activeVehicleIdAtom)) ?? null,
);
export const startingBatteryPctAtom = atom((get) => get(activeVehicleAtom)?.startingBatteryPct ?? 80);
export const activeEvCarAtom = atom<EvCar | null>((get) => {
  const vehicle = get(activeVehicleAtom);
  return vehicle ? getVehicleCar(vehicle) : null;
});
// Phase 2 allows range-only selection. The existing calculator still needs consumption;
// the shared rated-range projection belongs to Phase 3, not a fabricated adapter value.
export const calculationEvCarAtom = atom<EvCar | null>((get) => {
  const car = get(activeEvCarAtom);
  return car && car.consumptionKwhPer100km > 0
    && (!car.energyProfile || car.energyProfile.modelKind === "CONSUMPTION") ? car : null;
});
export const setChargeStopTargetPctAtom = atom(null, (_get, set, pct: number) => {
  set(chargeStopTargetPctAtom, normalizeChargeTargetPct(pct));
});
