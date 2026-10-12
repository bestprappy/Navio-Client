import type { EvCar } from "../constants/vehicle.types";

/** Display provenance only; never derive consumption from capacity and range. */
export function energyBasisLabel(car: EvCar): string {
  const p = car.energyProfile;
  if (!p || p.selectionMode === "LEGACY_UNCONFIRMED") return "Legacy estimate; source unconfirmed";
  if (p.modelKind === "RATED_RANGE") {
    const standard = p.ratedRangeStandard === "NONE" ? "" : ` ${p.ratedRangeStandard}`;
    return p.ratedRangeKm == null ? "Rated-range basis unavailable"
      : `NAVIO Estimate: based on ${p.ratedRangeKm} km${standard}. Provisional; automatic charger application unavailable.`;
  }
  if (p.modelKind !== "CONSUMPTION" || p.consumptionKwhPer100km == null) return "Consumption unavailable";
  const source = p.consumptionSource === "USER_OBSERVED" ? "User-observed average"
    : p.consumptionSource === "MANUFACTURER_REPORTED" ? "Manufacturer-reported consumption"
    : p.consumptionSource === "REGULATORY_REPORTED" ? "Regulatory-reported consumption" : "Consumption; source unknown";
  return `${source}: ${p.consumptionKwhPer100km} kWh/100 km`;
}

export function energyDisplayNumber(value: number | null | undefined, unit: string): string {
  return value == null || !Number.isFinite(value) ? "Unavailable" : `${Number(value.toFixed(1))}${unit}`;
}

export function energyAvailabilityLabel(reasons: string[]): string | null {
  if (reasons.includes("DISTANCE_UNAVAILABLE")) return "Some route distances are unavailable. A complete trip estimate cannot be confirmed.";
  if (reasons.includes("USABLE_CAPACITY_UNAVAILABLE")) return "Usable battery capacity is unconfirmed. Some energy or battery estimates are unavailable.";
  if (reasons.includes("ENERGY_MODEL_UNAVAILABLE")) return "An energy model is unavailable for this vehicle.";
  return null;
}
