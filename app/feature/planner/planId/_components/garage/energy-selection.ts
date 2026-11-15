import type { EvCar } from "../constants/vehicle.types";
import type { CatalogVehicle, SavedVehicle, VehicleEnergyProfile } from "./vehicle-api";

const positive = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/** Catalogue evidence is field-specific; rated range never creates consumption. */
export function defaultEnergyProfile(catalog: CatalogVehicle | null, rangeKm: number | null, ratedRangeOnly = false): VehicleEnergyProfile {
  const profile = catalog?.energyProfile;
  const direct = !ratedRangeOnly && profile?.modelKind === "CONSUMPTION" && (profile.consumptionKwhPer100km ?? 0) > 0
    && ["MANUFACTURER_REPORTED", "REGULATORY_REPORTED"].includes(profile.consumptionSource)
    && profile.consumptionMeasurementBasis === "BATTERY_SIDE" && Boolean(profile.sourceUrl);
  const range = catalog?.rangeKm ?? rangeKm;
  return {
    version: 1, modelKind: direct ? "CONSUMPTION" : range !== null && range > 0 ? "RATED_RANGE" : "UNAVAILABLE",
    selectionMode: "CATALOG_DEFAULT", consumptionKwhPer100km: direct ? profile.consumptionKwhPer100km : null,
    consumptionSource: direct ? profile.consumptionSource : "UNKNOWN",
    consumptionMeasurementBasis: direct ? profile.consumptionMeasurementBasis : "UNKNOWN",
    consumptionStandard: direct ? profile.consumptionStandard : "NONE", sourceUrl: direct ? profile.sourceUrl : null,
    usableBatteryCapacityKwh: profile?.usableBatteryCapacityKwh ?? null,
    capacityBasis: profile?.capacityBasis ?? (catalog ? "MANUFACTURER_DECLARED_UNSPECIFIED" : "UNKNOWN"),
    ratedRangeKm: range, ratedRangeStandard: catalog?.rangeStandard ?? "NONE",
  };
}

/**
 * Without a usable capacity a charge time cannot be computed, so the vehicle's declared battery size
 * stands in. The trip service applies the same fallback, keeping planner estimates and Auto Add aligned.
 */
export function withCalculationCapacity(profile: VehicleEnergyProfile, declaredBatteryKwh: number | null | undefined): VehicleEnergyProfile {
  return positive(profile.usableBatteryCapacityKwh) || !positive(declaredBatteryKwh) ? profile
    : { ...profile, usableBatteryCapacityKwh: declaredBatteryKwh };
}

export function energySelectionDescription(profile: VehicleEnergyProfile): string {
  if (profile.selectionMode === "LEGACY_UNCONFIRMED") return "Legacy estimate: source unknown. Choose a default, NAVIO Estimate or your own average to confirm it.";
  if (profile.modelKind === "RATED_RANGE") return `NAVIO Estimate: based on ${profile.ratedRangeKm} km${profile.ratedRangeStandard === "NONE" ? "" : ` (${profile.ratedRangeStandard})`}. Real use varies with speed, load and weather.`;
  if (profile.modelKind === "UNAVAILABLE") return "Energy model unavailable. Enter your observed average or a reference range.";
  return `${profile.consumptionSource === "USER_OBSERVED" ? "Your average" : "Catalogue consumption"}: ${profile.consumptionKwhPer100km} kWh/100 km. Measurement basis: ${profile.consumptionMeasurementBasis.toLowerCase().replaceAll("_", " ")}.`;
}

/**
 * Auto Add works with any model that can predict the battery: the traveller's own
 * average, the catalogue figure, or the NAVIO Estimate from rated range. Each needs a battery size so
 * charging time can be computed.
 */
export function canAutomaticallyPlan(car: EvCar | null): boolean {
  const profile = car?.energyProfile;
  if (!car || !profile) return false;
  if (!positive(profile.usableBatteryCapacityKwh) && !positive(car.batteryKwh)) return false;
  return (profile.modelKind === "CONSUMPTION" && positive(profile.consumptionKwhPer100km))
    || (profile.modelKind === "RATED_RANGE" && positive(profile.ratedRangeKm));
}

export function isLegacyVehicle(vehicle: SavedVehicle): boolean {
  return !vehicle.energyProfile || vehicle.energyProfile.selectionMode === "LEGACY_UNCONFIRMED";
}
