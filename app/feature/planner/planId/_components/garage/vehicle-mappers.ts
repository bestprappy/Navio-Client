import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import type { CatalogVehicle, SavedVehicle } from "./vehicle-api";
import { legacyEnergyProfile } from "./vehicle-api";

export function catalogVehicleCar(vehicle: CatalogVehicle): EvCar {
  return {
    ...vehicle, batteryKwh: vehicle.batteryCapacityKwh,
    consumptionKwhPer100km: 0, // Catalogue cards are specification previews, not calculation inputs.
    maxAcKw: vehicle.maxAcKw ?? 0, maxDcKw: vehicle.maxDcKw ?? 0,
    chargingLimitsKnown: vehicle.maxAcKw !== null && vehicle.maxDcKw !== null,
    chargingCapabilities: { acKw: vehicle.maxAcKw, dcKw: vehicle.maxDcKw },
  };
}

export function savedVehicleForPlanner(vehicle: SavedVehicle): UserVehicle {
  const car: EvCar = {
    id: vehicle.catalog?.id ?? vehicle.id, make: vehicle.make, model: vehicle.model, year: vehicle.year,
    batteryKwh: vehicle.batteryCapacityKwh, rangeKm: vehicle.rangeKm,
    consumptionKwhPer100km: vehicle.consumptionKwhPer100km ?? 0,
    connectorTypes: vehicle.connectorTypes,
    maxAcKw: vehicle.settings.maxAcKw ?? 0, maxDcKw: vehicle.settings.maxDcKw ?? 0,
    imageUrl: vehicle.settings.imageUrl ?? undefined,
    trim: vehicle.catalog?.trim, market: vehicle.catalog?.market,
    rangeStandard: vehicle.catalog?.rangeStandard ?? "User supplied",
    sourceUrl: vehicle.catalog?.sourceUrl, verifiedAt: vehicle.catalog?.verifiedAt,
    chargingLimitsKnown: vehicle.settings.maxAcKw !== null && vehicle.settings.maxDcKw !== null,
    chargingCapabilities: { acKw: vehicle.settings.maxAcKw, dcKw: vehicle.settings.maxDcKw },
    energyProfile: vehicle.energyProfile ?? legacyEnergyProfile(vehicle),
    legacyConsumptionConfirmed: vehicle.legacyConsumptionConfirmed,
  };
  const base = { id: vehicle.id, nickname: vehicle.nickname ?? undefined, startingBatteryPct: vehicle.settings.startingBatteryPct };
  return vehicle.catalog ? { ...base, source: "preset", carId: vehicle.catalog.id, car }
    : { ...base, source: "custom", customCar: car };
}
