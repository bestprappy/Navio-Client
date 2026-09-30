import model from "./simulation-model.json";

/** Mirrors mobility-and-ev-service src/main/resources/simulation/model-v1.json; keep both identical (no automated parity check yet). */
export const SIMULATION_MODEL = Object.freeze(model);

export function baselineEnergy(distanceKm: number, consumptionKwhPer100km: number) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || !Number.isFinite(consumptionKwhPer100km) || consumptionKwhPer100km <= 0) {
    throw new RangeError("Distance must be nonnegative and battery-side consumption must be positive.");
  }
  const nominalKwh = distanceKm * consumptionKwhPer100km / 100;
  return { nominalKwh, planningKwh: nominalKwh * (1 + model.planningMarginFraction) };
}

/** Battery-side power. Generic DC taper is an explicit assumption; AC stays constant. */
export function chargeMinutes(arrivalPct: number, targetPct: number, batteryKwh: number, powerKw: number, dc: boolean): number {
  if (![arrivalPct, targetPct, batteryKwh, powerKw].every(Number.isFinite) || batteryKwh <= 0) throw new RangeError("Invalid charging inputs.");
  if (powerKw <= 0 || targetPct <= arrivalPct) return 0;
  const start = Math.max(0, Math.min(100, arrivalPct));
  const end = Math.max(start, Math.min(100, targetPct));
  const fastPct = dc ? Math.max(0, Math.min(end, model.dcTaperStartPct) - start) : end - start;
  const slowPct = dc ? Math.max(0, end - Math.max(start, model.dcTaperStartPct)) : 0;
  const minutes = batteryKwh / 100 / (powerKw * model.chargeEfficiency) *
    (fastPct + slowPct / model.dcTaperPowerFraction) * 60;
  return Math.max(0, Math.ceil(minutes - 1e-9));
}

/** Inverse of the same power curve for legacy stops stored as minutes. */
export function chargeTarget(arrivalPct: number, minutes: number, batteryKwh: number, powerKw: number, dc: boolean): number {
  if (![arrivalPct, minutes, batteryKwh, powerKw].every(Number.isFinite) || batteryKwh <= 0) throw new RangeError("Invalid charging inputs.");
  const start = Math.max(0, Math.min(100, arrivalPct));
  if (minutes <= 0 || powerKw <= 0) return start;
  const pctPerMinute = powerKw * model.chargeEfficiency / batteryKwh * 100 / 60;
  const fastPct = dc ? Math.max(0, model.dcTaperStartPct - start) : 100 - start;
  const fastMinutes = Math.min(minutes, fastPct / pctPerMinute);
  return Math.min(100, start + fastMinutes * pctPerMinute +
    (minutes - fastMinutes) * pctPerMinute * (dc ? model.dcTaperPowerFraction : 1));
}
