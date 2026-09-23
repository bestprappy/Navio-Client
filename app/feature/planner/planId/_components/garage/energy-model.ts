import type { VehicleEnergyProfile } from "./vehicle-api";

export const ENERGY_POLICY_VERSION = "navio-energy-v1" as const;
export const ARRIVAL_RESERVE_PCT = 12;
export const ENERGY_EPSILON = 1e-9;
export type DistanceQuality = "ROUTED" | "FALLBACK" | "UNAVAILABLE";
export type EnergyModel = Pick<VehicleEnergyProfile, "modelKind" | "consumptionKwhPer100km" | "usableBatteryCapacityKwh" | "ratedRangeKm">;
export type ChargingEvent = {
  targetSocPct: number | null;
  durationMinutes: number | null;
  compatible: boolean | null;
  effectivePowerKw: number | null;
};
export type EnergyInput = {
  model: EnergyModel;
  distanceKm: number | null;
  distanceQuality: DistanceQuality;
  departureSocPct: number | null;
  observedSocPct?: number | null;
  charging?: ChargingEvent | null;
  reserveSocPct?: number;
};
export type EnergyResult = {
  policyVersion: typeof ENERGY_POLICY_VERSION;
  modelKind: EnergyModel["modelKind"];
  provisional: boolean;
  uncertaintyStatus: "UNCALIBRATED";
  uncertaintyAllowance: null;
  availability: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";
  reasons: string[];
  distanceQuality: DistanceQuality;
  nominalEnergyKwh: number | null;
  nominalSocUsePct: number | null;
  rawPredictedArrivalSocPct: number | null;
  displayArrivalSocPct: number | null;
  observedSocPct: number | null;
  departureSocPct: number | null;
  predictedArrivalReserveStatus: "AT_OR_ABOVE_RESERVE" | "BELOW_RESERVE" | "UNKNOWN";
  predictedLegFeasibility: "FEASIBLE" | "INFEASIBLE" | "UNKNOWN";
  chargeEnergyKwh: number | null;
  nominalChargeMinutes: number | null;
};

export const positive = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
export const validSoc = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
export const displaySoc = (value: number | null) => value === null ? null : Math.max(0, Math.min(100, value));

/** Pure nominal calculation. Observations replace forward state, never predicted history. */
export function calculateEnergy(input: EnergyInput): EnergyResult {
  const { model } = input;
  const reasons: string[] = [];
  const capacity = positive(model.usableBatteryCapacityKwh) ? model.usableBatteryCapacityKwh : null;
  const distance = input.distanceQuality !== "UNAVAILABLE" && input.distanceKm !== null && Number.isFinite(input.distanceKm) && input.distanceKm >= 0 ? input.distanceKm : null;
  let energy: number | null = null;
  let depletion: number | null = null;
  if (distance === null) reasons.push("DISTANCE_UNAVAILABLE");
  else if (model.modelKind === "CONSUMPTION" && positive(model.consumptionKwhPer100km)) {
    energy = distance * model.consumptionKwhPer100km / 100;
    if (capacity !== null) depletion = energy / capacity * 100;
    else reasons.push("USABLE_CAPACITY_UNAVAILABLE");
  } else if (model.modelKind === "RATED_RANGE" && positive(model.ratedRangeKm)) {
    depletion = distance / model.ratedRangeKm * 100;
    if (capacity !== null) energy = capacity * distance / model.ratedRangeKm;
    else reasons.push("USABLE_CAPACITY_UNAVAILABLE");
  } else reasons.push("ENERGY_MODEL_UNAVAILABLE");
  // A stationary event consumes no driving energy, including at the first stop.
  if (distance === 0) { energy = 0; depletion = 0; }
  const arrival = validSoc(input.departureSocPct) && depletion !== null ? input.departureSocPct - depletion : null;
  if (!validSoc(input.departureSocPct)) reasons.push("UPSTREAM_SOC_UNAVAILABLE");
  const observed = input.observedSocPct == null ? null : input.observedSocPct;
  if (observed !== null && !validSoc(observed)) throw new Error("Observed SoC must be between 0 and 100.");
  const infeasible = arrival !== null && arrival < -ENERGY_EPSILON;
  if (infeasible) reasons.push("PREDICTED_LEG_INFEASIBLE");
  let departure = observed ?? (arrival === null || infeasible ? null : Math.max(0, arrival));
  let chargeEnergy: number | null = 0;
  let chargeMinutes: number | null = 0;
  const charge = input.charging;
  if (charge) {
    if (departure === null) {
      chargeEnergy = null; chargeMinutes = null; reasons.push("CHARGING_START_UNAVAILABLE");
    } else if (charge.compatible !== true) {
      if (charge.compatible === null) { departure = null; chargeEnergy = null; chargeMinutes = null; reasons.push("CONNECTOR_COMPATIBILITY_UNAVAILABLE"); }
      else reasons.push("INCOMPATIBLE_CHARGER");
    } else {
      const power = positive(charge.effectivePowerKw) ? charge.effectivePowerKw : null;
      if (charge.targetSocPct !== null) {
        if (!validSoc(charge.targetSocPct)) throw new Error("Charge target must be between 0 and 100.");
        const delta = Math.max(0, charge.targetSocPct - departure);
        chargeEnergy = delta === 0 ? 0 : capacity === null ? null : capacity * delta / 100;
        departure += delta;
        chargeMinutes = chargeEnergy === 0 ? 0 : chargeEnergy === null || power === null ? null : 60 * chargeEnergy / power;
      } else if (charge.durationMinutes !== null && Number.isFinite(charge.durationMinutes) && charge.durationMinutes >= 0 && power !== null && capacity !== null) {
        chargeEnergy = Math.min((100 - departure) * capacity / 100, charge.durationMinutes * power / 60);
        chargeMinutes = 60 * chargeEnergy / power;
        departure += chargeEnergy / capacity * 100;
      } else {
        chargeEnergy = null; chargeMinutes = null; departure = null;
      }
      if (chargeEnergy === null) reasons.push("CHARGING_ENERGY_UNAVAILABLE");
      if (chargeMinutes === null) reasons.push("CHARGING_DURATION_UNAVAILABLE");
    }
  }
  const reserve = input.reserveSocPct ?? ARRIVAL_RESERVE_PCT;
  if (!validSoc(reserve)) throw new Error("Reserve must be between 0 and 100.");
  return {
    policyVersion: ENERGY_POLICY_VERSION, modelKind: model.modelKind, provisional: model.modelKind === "RATED_RANGE",
    uncertaintyStatus: "UNCALIBRATED", uncertaintyAllowance: null,
    availability: energy === null && depletion === null ? "UNAVAILABLE" : reasons.some(reason => reason.endsWith("UNAVAILABLE")) ? "PARTIAL" : "AVAILABLE",
    reasons, distanceQuality: distance === null ? "UNAVAILABLE" : input.distanceQuality,
    nominalEnergyKwh: energy, nominalSocUsePct: depletion, rawPredictedArrivalSocPct: arrival,
    displayArrivalSocPct: displaySoc(arrival), observedSocPct: observed, departureSocPct: departure,
    predictedArrivalReserveStatus: arrival === null ? "UNKNOWN" : arrival + ENERGY_EPSILON >= reserve ? "AT_OR_ABOVE_RESERVE" : "BELOW_RESERVE",
    predictedLegFeasibility: arrival === null ? "UNKNOWN" : infeasible ? "INFEASIBLE" : "FEASIBLE",
    chargeEnergyKwh: chargeEnergy, nominalChargeMinutes: chargeMinutes,
  };
}

export type EnergyStop = Omit<EnergyInput, "model" | "departureSocPct" | "reserveSocPct"> & { id: string; dayId: string };
export function projectEnergyTrip(model: EnergyModel, initialSocPct: number | null, stops: EnergyStop[], reserveSocPct = ARRIVAL_RESERVE_PCT) {
  if (initialSocPct !== null && !validSoc(initialSocPct)) throw new Error("Starting SoC must be between 0 and 100.");
  let forward = initialSocPct;
  return stops.map(stop => {
    const startingSocPct = forward;
    const result = calculateEnergy({ ...stop, model, departureSocPct: forward, reserveSocPct });
    forward = result.departureSocPct;
    return { id: stop.id, dayId: stop.dayId, startingSocPct, ...result };
  });
}
