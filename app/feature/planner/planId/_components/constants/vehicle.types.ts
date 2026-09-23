import type { EvConnectorType } from "./types";
import type { VehicleEnergyProfile } from "../garage/vehicle-api";

export type EvCar = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  batteryKwh: number;
  rangeKm: number;
  consumptionKwhPer100km: number;
  maxAcKw: number;
  maxDcKw: number;
  connectorTypes: EvConnectorType[];
  imageUrl?: string;
  trim?: string;
  market?: string;
  rangeStandard?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  chargingLimitsKnown?: boolean;
  chargingCapabilities?: { acKw: number | null; dcKw: number | null };
  energyProfile?: VehicleEnergyProfile | null;
  legacyConsumptionConfirmed?: boolean;
};

type UserVehicleBase = {
  id: string;
  nickname?: string;
  startingBatteryPct: number;
};

export type PresetUserVehicle = UserVehicleBase & {
  source: "preset";
  carId: string;
  car: EvCar;
};

export type CustomUserVehicle = UserVehicleBase & {
  source: "custom";
  customCar: EvCar;
};

export type UserVehicle = PresetUserVehicle | CustomUserVehicle;
