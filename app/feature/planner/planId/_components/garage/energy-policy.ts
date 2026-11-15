import type { VehicleEnergyProfile } from "./vehicle-api";

/** A road-trip allowance, not a measured capacity loss or a certification conversion. */
export const ROAD_RANGE_REDUCTION_PCT = 20;
export const REAL_WORLD_ENERGY_CAPABILITY = "real-world-energy-v2";
export type PlanningEnergyModel = Pick<VehicleEnergyProfile,
  "modelKind" | "consumptionKwhPer100km" | "usableBatteryCapacityKwh" | "ratedRangeKm"
> & Partial<Pick<VehicleEnergyProfile, "consumptionSource">>;

/** All EVs/chemistries use the same policy. Observed/unconfirmed consumption is not adjusted twice. */
export function rangeReductionPct(model: PlanningEnergyModel): number {
  return model.modelKind === "RATED_RANGE" || (model.modelKind === "CONSUMPTION"
    && (model.consumptionSource === "MANUFACTURER_REPORTED" || model.consumptionSource === "REGULATORY_REPORTED"))
    ? ROAD_RANGE_REDUCTION_PCT : 0;
}

export function rangeRetention(model: PlanningEnergyModel): number {
  return 1 - rangeReductionPct(model) / 100;
}

export function baseRangeKm(model: PlanningEnergyModel): number | null {
  if (model.modelKind === "RATED_RANGE" && finitePositive(model.ratedRangeKm)) return model.ratedRangeKm;
  if (model.modelKind === "CONSUMPTION" && finitePositive(model.usableBatteryCapacityKwh)
    && finitePositive(model.consumptionKwhPer100km)) {
    return model.usableBatteryCapacityKwh / model.consumptionKwhPer100km * 100;
  }
  return null;
}

export function planningRangeKm(model: PlanningEnergyModel): number | null {
  const range = baseRangeKm(model);
  return range === null ? null : range * rangeRetention(model);
}

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
