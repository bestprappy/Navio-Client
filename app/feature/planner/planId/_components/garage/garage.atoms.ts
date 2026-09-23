import { tripEnergyStateAtom } from "./trip-energy-state";
import { atom } from "jotai";

import { getVehicleCar } from "../constants/vehicle.data";
import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import { AUTO_CHARGE_TARGET_DEFAULT_PCT, normalizeChargeTargetPct } from "./ev-calculator";

// Read-only projection of TanStack Query data for existing planner calculations.
// GarageProvider is the only writer; mutations always go through the API.
export const garageVehiclesSnapshotAtom = atom<UserVehicle[]>([]);
export const garageActiveIdSnapshotAtom = atom<string | null>(null);
export const userVehiclesAtom = atom((get) => get(garageVehiclesSnapshotAtom));
export const activeVehicleIdAtom = atom((get) => get(tripEnergyStateAtom)?.vehicleSnapshot?.vehicleId ?? get(garageActiveIdSnapshotAtom));
export const garageModalOpenAtom = atom(false);
export const chargeStopTargetPctAtom = atom(AUTO_CHARGE_TARGET_DEFAULT_PCT);
export const activeVehicleAtom = atom((get) =>
  get(userVehiclesAtom).find((vehicle) => vehicle.id === get(activeVehicleIdAtom)) ?? null,
);
export const startingBatteryPctAtom = atom((get) => get(tripEnergyStateAtom)?.initialSocPct ?? get(activeVehicleAtom)?.startingBatteryPct ?? 80);
export const activeEvCarAtom = atom<EvCar | null>((get) => {
  const snapshot = get(tripEnergyStateAtom)?.vehicleSnapshot;
  if (snapshot) return {
    id: snapshot.vehicleId, make: "", model: snapshot.label, year: null,
    batteryKwh: snapshot.profile.usableBatteryCapacityKwh ?? 0,
    rangeKm: snapshot.profile.ratedRangeKm ?? 0,
    consumptionKwhPer100km: snapshot.profile.consumptionKwhPer100km ?? 0,
    maxAcKw: snapshot.maxAcKw ?? 0, maxDcKw: snapshot.maxDcKw ?? 0,
    chargingCapabilities: { acKw: snapshot.maxAcKw, dcKw: snapshot.maxDcKw },
    connectorTypes: snapshot.connectorTypes, energyProfile: snapshot.profile,
    legacyConsumptionConfirmed: snapshot.legacyConsumptionConfirmed,
  };
  const vehicle = get(activeVehicleAtom);
  return vehicle ? getVehicleCar(vehicle) : null;
});
// Compatibility selector for the deferred Auto Add policy; trip projection uses activeEvCarAtom.
export const calculationEvCarAtom = atom<EvCar | null>((get) => {
  const car = get(activeEvCarAtom);
  return car && car.consumptionKwhPer100km > 0
    && (!car.energyProfile || car.energyProfile.modelKind === "CONSUMPTION") ? car : null;
});
export const setChargeStopTargetPctAtom = atom(null, (_get, set, pct: number) => {
  set(chargeStopTargetPctAtom, normalizeChargeTargetPct(pct));
});
