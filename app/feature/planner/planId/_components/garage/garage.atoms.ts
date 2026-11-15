import { tripEnergyStateAtom } from "./trip-energy-state";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { getVehicleCar } from "../constants/vehicle.data";
import type { EvCar, UserVehicle } from "../constants/vehicle.types";

// Read-only projection of TanStack Query data for existing planner calculations.
// GarageProvider is the only writer; mutations always go through the API.
export const garageVehiclesSnapshotAtom = atom<UserVehicle[]>([]);
export const garageActiveIdSnapshotAtom = atom<string | null>(null);
export const userVehiclesAtom = atom((get) => get(garageVehiclesSnapshotAtom));
export const activeVehicleIdAtom = atom((get) => get(tripEnergyStateAtom)?.vehicleSnapshot?.vehicleId ?? get(garageActiveIdSnapshotAtom));
export const garageModalOpenAtom = atom(false);

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
/** Legacy quick choices; the shared threshold also accepts exact percentages. */
export const ARRIVAL_RESERVE_OPTIONS: readonly number[] = [10, 12, 15, 20];
function percentagePreference(key: string, fallback: number) {
  const storage = atomWithStorage(key, fallback);
  return atom(get => { const value = get(storage); return Number.isFinite(value) && value >= 1 && value <= 100 ? value : fallback; },
    (_get, set, value: number) => { if (Number.isFinite(value)) set(storage, Math.max(1, Math.min(100, Math.round(value)))); });
}
export const batteryThresholdPctAtom = percentagePreference("navio:arrival-reserve-pct", 12);
export const minimumArrivalPctAtom = percentagePreference("navio:minimum-day-arrival-pct", 20);

// Existing battery warnings and gauges use the same threshold as Auto Add.
export const arrivalReservePctAtom = batteryThresholdPctAtom;
