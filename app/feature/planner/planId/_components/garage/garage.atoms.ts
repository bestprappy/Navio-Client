import { atom } from "jotai";

import { getVehicleCar } from "../constants/vehicle.data";
import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import {
  AUTO_CHARGE_TARGET_DEFAULT_PCT,
  normalizeChargeTargetPct,
} from "./ev-calculator";

let vehicleCounter = 0;
let customVehicleCounter = 0;

function generateVehicleId(): string {
  return `vehicle-${Date.now()}-${++vehicleCounter}`;
}

function generateCustomVehicleId(): string {
  return `custom-vehicle-${Date.now()}-${++customVehicleCounter}`;
}

type AddPresetVehiclePayload = {
  source: "preset";
  carId: string;
  nickname?: string;
};

type AddCustomVehiclePayload = {
  source: "custom";
  car: Omit<EvCar, "id"> & { id?: string };
  nickname?: string;
};

export type AddVehiclePayload =
  | AddPresetVehiclePayload
  | AddCustomVehiclePayload;

export const userVehiclesAtom = atom<UserVehicle[]>([]);

export const activeVehicleIdAtom = atom<string | null>(null);

export const garageModalOpenAtom = atom<boolean>(false);

export const startingBatteryPctAtom = atom<number>(80);

export const chargeStopTargetPctAtom = atom<number>(
  AUTO_CHARGE_TARGET_DEFAULT_PCT,
);

export const activeVehicleAtom = atom<UserVehicle | null>((get) => {
  const vehicles = get(userVehiclesAtom);
  const activeId = get(activeVehicleIdAtom);
  if (!activeId) return null;
  return vehicles.find((v) => v.id === activeId) ?? null;
});

export const activeEvCarAtom = atom<EvCar | null>((get) => {
  const vehicle = get(activeVehicleAtom);
  if (!vehicle) return null;
  return getVehicleCar(vehicle) ?? null;
});

export const addVehicleAtom = atom(
  null,
  (get, set, payload: AddVehiclePayload) => {
    if (payload.source === "preset") {
      const existing = get(userVehiclesAtom).find(
        (v) => v.source === "preset" && v.carId === payload.carId,
      );

      if (existing) {
        set(activeVehicleIdAtom, existing.id);
        set(startingBatteryPctAtom, existing.startingBatteryPct);
        set(garageModalOpenAtom, false);
        return;
      }
    }

    const newVehicle: UserVehicle =
      payload.source === "custom"
        ? {
            id: generateVehicleId(),
            source: "custom",
            customCar: {
              ...payload.car,
              id: payload.car.id ?? generateCustomVehicleId(),
            },
            nickname: payload.nickname?.trim() || undefined,
            startingBatteryPct: get(startingBatteryPctAtom),
          }
        : {
            id: generateVehicleId(),
            source: "preset",
            carId: payload.carId,
            nickname: payload.nickname?.trim() || undefined,
            startingBatteryPct: get(startingBatteryPctAtom),
          };

    set(userVehiclesAtom, (prev) => [...prev, newVehicle]);
    set(activeVehicleIdAtom, newVehicle.id);
    set(garageModalOpenAtom, false);
  },
);

export const removeVehicleAtom = atom(null, (get, set, vehicleId: string) => {
  const remaining = get(userVehiclesAtom).filter((v) => v.id !== vehicleId);

  set(userVehiclesAtom, remaining);

  if (get(activeVehicleIdAtom) === vehicleId) {
    const nextVehicle = remaining[0];
    set(activeVehicleIdAtom, nextVehicle?.id ?? null);

    if (nextVehicle) {
      set(startingBatteryPctAtom, nextVehicle.startingBatteryPct);
    }
  }
});

export const setActiveVehicleAtom = atom(null, (get, set, vehicleId: string) => {
  const vehicle = get(userVehiclesAtom).find((v) => v.id === vehicleId);

  set(activeVehicleIdAtom, vehicleId);

  if (vehicle) {
    set(startingBatteryPctAtom, vehicle.startingBatteryPct);
  }
});

export const setStartingBatteryPctAtom = atom(null, (get, set, pct: number) => {
  const nextPct = Math.max(0, Math.min(100, Math.round(pct)));
  const activeVehicleId = get(activeVehicleIdAtom);

  set(startingBatteryPctAtom, nextPct);

  if (!activeVehicleId) return;

  set(userVehiclesAtom, (prev) =>
    prev.map((vehicle) =>
      vehicle.id === activeVehicleId
        ? { ...vehicle, startingBatteryPct: nextPct }
        : vehicle,
    ),
  );
});

export const setChargeStopTargetPctAtom = atom(
  null,
  (_get, set, pct: number) => {
    set(chargeStopTargetPctAtom, normalizeChargeTargetPct(pct));
  },
);
