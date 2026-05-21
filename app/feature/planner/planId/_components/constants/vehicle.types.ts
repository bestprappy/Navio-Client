import type { EvConnectorType } from "./types";

export type EvCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  batteryKwh: number;
  rangeKm: number;
  consumptionKwhPer100km: number;
  maxAcKw: number;
  maxDcKw: number;
  connectorTypes: EvConnectorType[];
  imageUrl?: string;
};

type UserVehicleBase = {
  id: string;
  nickname?: string;
  startingBatteryPct: number;
};

export type PresetUserVehicle = UserVehicleBase & {
  source: "preset";
  carId: string;
};

export type CustomUserVehicle = UserVehicleBase & {
  source: "custom";
  customCar: EvCar;
};

export type UserVehicle = PresetUserVehicle | CustomUserVehicle;
