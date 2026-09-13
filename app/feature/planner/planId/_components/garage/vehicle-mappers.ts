import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import type { CatalogVehicle, SavedVehicle } from "./vehicle-api";

// Share of the official test range typically achieved on real roads. Test cycles are optimistic by different amounts.
const REAL_WORLD_RANGE_FACTOR: Record<CatalogVehicle["rangeStandard"], number> = { NEDC: 0.7, CLTC: 0.7, WLTP: 0.85, EPA: 0.9 };

/** Rough kWh/100 km from declared capacity and test range, used only when the driver does not know their average. */
export function estimateCatalogConsumption(vehicle: CatalogVehicle): number {
  const realWorldRangeKm = vehicle.rangeKm * REAL_WORLD_RANGE_FACTOR[vehicle.rangeStandard];
  return Math.round((vehicle.batteryCapacityKwh / realWorldRangeKm) * 1000) / 10;
}

export function catalogVehicleCar(vehicle: CatalogVehicle): EvCar {
  return {
    ...vehicle, batteryKwh: vehicle.batteryCapacityKwh,
    consumptionKwhPer100km: 0, // Not supplied by the source. Estimates are opt-in at save time via estimateCatalogConsumption.
    maxAcKw: vehicle.maxAcKw ?? 0, maxDcKw: vehicle.maxDcKw ?? 0,
    chargingLimitsKnown: vehicle.maxAcKw !== null && vehicle.maxDcKw !== null,
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
  };
  const base = { id: vehicle.id, nickname: vehicle.nickname ?? undefined, startingBatteryPct: vehicle.settings.startingBatteryPct };
  return vehicle.catalog ? { ...base, source: "preset", carId: vehicle.catalog.id, car }
    : { ...base, source: "custom", customCar: car };
}
