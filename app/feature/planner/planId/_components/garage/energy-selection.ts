import type { EvCar } from "../constants/vehicle.types";
import type { CatalogVehicle, SavedVehicle, VehicleEnergyProfile } from "./vehicle-api";

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

export function energySelectionDescription(profile: VehicleEnergyProfile): string {
  if (profile.selectionMode === "LEGACY_UNCONFIRMED") return "Legacy estimate: source unknown. Automatic charger application requires explicit confirmation of the existing value. You can also choose a default or your own average.";
  if (profile.modelKind === "RATED_RANGE") return `Rated-range preview: ${profile.ratedRangeKm} km${profile.ratedRangeStandard === "NONE" ? "" : ` (${profile.ratedRangeStandard})`}. No consumption value is derived. Automatic charger application is unavailable.`;
  if (profile.modelKind === "UNAVAILABLE") return "Energy model unavailable. Enter your observed average or a reference range.";
  return `${profile.consumptionSource === "USER_OBSERVED" ? "Your average" : "Catalogue consumption"}: ${profile.consumptionKwhPer100km} kWh/100 km. Measurement basis: ${profile.consumptionMeasurementBasis.toLowerCase().replaceAll("_", " ")}.`;
}

export function canAutomaticallyPlan(car: EvCar | null): boolean {
  if (!car || !(car.consumptionKwhPer100km > 0)) return false;
  const profile = car.energyProfile;
  if (!profile || profile.selectionMode === "LEGACY_UNCONFIRMED") return car.legacyConsumptionConfirmed === true;
  return profile.modelKind === "CONSUMPTION";
}

export function isLegacyVehicle(vehicle: SavedVehicle): boolean {
  return !vehicle.energyProfile || vehicle.energyProfile.selectionMode === "LEGACY_UNCONFIRMED";
}
