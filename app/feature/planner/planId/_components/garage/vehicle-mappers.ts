import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import type { CatalogVehicle, SavedVehicle } from "./vehicle-api";

type RangeStandard = CatalogVehicle["rangeStandard"];

/**
 * Share of the official test range assumed achievable on real roads. Conservative planning estimates,
 * not measured constants: NEDC and CLTC match EPA's own 0.7 default for raw lab ranges, and EPA labels
 * are already adjusted. Sources and caveats: docs/research/ev-range-test-standards.md.
 */
export const REAL_WORLD_RANGE_FACTOR: Record<RangeStandard, number> = { NEDC: 0.7, CLTC: 0.7, WLTP: 0.85, EPA: 0.9 };

function isRangeStandard(value: string | undefined): value is RangeStandard {
  return value !== undefined && Object.hasOwn(REAL_WORLD_RANGE_FACTOR, value);
}

/** Real-world range estimate rounded to 10 km, or null when the test standard is unknown (custom specs). */
export function estimateRealWorldRange(rangeKm: number, standard: string | undefined): { km: number; factor: number } | null {
  if (!isRangeStandard(standard) || !(rangeKm > 0)) return null;
  const factor = REAL_WORLD_RANGE_FACTOR[standard];
  return { km: Math.round((rangeKm * factor) / 10) * 10, factor };
}

/**
 * kWh/100 km that gives this full-charge range. The real-world adjustment lives here, in consumption,
 * and not in battery capacity: reducing both would count the same loss twice.
 */
export function consumptionForRange(batteryKwh: number, rangeKm: number): number {
  return Math.round((batteryKwh / rangeKm) * 100_000) / 1000;
}

/** Full-charge range in whole km for a consumption, the inverse of consumptionForRange. */
export function rangeForConsumption(batteryKwh: number, consumptionKwhPer100km: number): number {
  return Math.round((batteryKwh / consumptionKwhPer100km) * 100);
}

/** Rough kWh/100 km from declared capacity and adjusted test range, used only when the driver does not know their average. */
export function estimateCatalogConsumption(vehicle: CatalogVehicle): number {
  return consumptionForRange(vehicle.batteryCapacityKwh, vehicle.rangeKm * REAL_WORLD_RANGE_FACTOR[vehicle.rangeStandard]);
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
