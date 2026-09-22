import { SIMULATION_MODEL, baselineEnergy } from "./simulation-model";

export type SimulationSegment = {
  distanceMeters: number;
  durationSeconds: number;
  elevationDeltaMeters: number;
  /** Optional known speed endpoints for a drive-cycle sample; absent means constant average speed. */
  startSpeedMps?: number;
  endSpeedMps?: number;
};

export type PhysicsProfile = {
  massKg: number;
  dragAreaM2: number;
  rollingResistance: number;
  airDensityKgM3: number;
  driveEfficiency: number;
  regenEfficiency: number;
  maxRegenKw: number;
  auxiliaryKw: number;
};

/** Scenario assumptions, never presented as manufacturer specifications. */
export const DEFAULT_PHYSICS: PhysicsProfile = {
  massKg: 1800, dragAreaM2: 0.65, rollingResistance: 0.01,
  airDensityKgM3: 1.225, driveEfficiency: 0.9, regenEfficiency: 0.65,
  maxRegenKw: 50, auxiliaryKw: 1,
};

export type SimulationInput = {
  model: "baseline" | "physics";
  usableBatteryKwh: number;
  startingSocPct: number;
  reserveSocPct: number;
  planningMarginFraction: number;
  consumptionKwhPer100km: number;
  profile: PhysicsProfile;
  segments: SimulationSegment[];
};

function within(value: number, min: number, max: number, name: string) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be between ${min} and ${max}.`);
}

export function validateSegments(segments: SimulationSegment[]) {
  if (!Array.isArray(segments) || !segments.length || segments.length > 10000) throw new RangeError("Provide 1–10,000 route samples.");
  for (const segment of segments) {
    if (!segment || typeof segment !== "object") throw new RangeError("Every sample must be an object.");
    within(segment.distanceMeters, 0, 2000000, "Sample distance in metres");
    within(segment.durationSeconds, 0.001, 172800, "Sample duration in seconds");
    within(segment.elevationDeltaMeters, -10000, 10000, "Elevation change in metres");
    if (Math.abs(segment.elevationDeltaMeters) > segment.distanceMeters) throw new RangeError("Elevation change cannot exceed travelled distance.");
    if ((segment.startSpeedMps == null) !== (segment.endSpeedMps == null)) throw new RangeError("Provide both speed endpoints or neither.");
    if (segment.startSpeedMps != null) {
      within(segment.startSpeedMps, 0, 100, "Start speed in m/s");
      within(segment.endSpeedMps!, 0, 100, "End speed in m/s");
      const expectedDistance = (segment.startSpeedMps + segment.endSpeedMps!) / 2 * segment.durationSeconds;
      if (Math.abs(expectedDistance - segment.distanceMeters) > Math.max(0.01, segment.distanceMeters * 0.001)) {
        throw new RangeError("Speed endpoints must match distance and duration for a linear-speed sample.");
      }
    }
    within(segment.distanceMeters / segment.durationSeconds, 0, 100, "Average speed in m/s");
  }
}

export function simulateEnergy(input: SimulationInput) {
  within(input.usableBatteryKwh, 0.1, 1000, "Usable battery capacity");
  within(input.startingSocPct, 0, 100, "Starting SOC");
  within(input.reserveSocPct, 0, 100, "Reserve SOC");
  within(input.planningMarginFraction, 0, 1, "Planning margin");
  within(input.consumptionKwhPer100km, 0.1, 200, "Battery-side consumption");
  if (input.model !== "baseline" && input.model !== "physics") throw new RangeError("Unknown energy model.");
  validateSegments(input.segments);
  const p = input.profile;
  within(p.massKg, 100, 10000, "Mass");
  within(p.dragAreaM2, 0, 10, "Drag area");
  within(p.rollingResistance, 0, 0.1, "Rolling resistance");
  within(p.airDensityKgM3, 0.5, 2, "Air density");
  within(p.driveEfficiency, 0.1, 1, "Drivetrain efficiency");
  within(p.regenEfficiency, 0, 1, "Regeneration efficiency");
  within(p.maxRegenKw, 0, 500, "Regeneration limit");
  within(p.auxiliaryKw, 0, 30, "Auxiliary power");
  let storedKwh = input.usableBatteryKwh * input.startingSocPct / 100;
  let minimumSocPct = input.startingSocPct;
  let nominalKwh = 0;
  let planningKwh = 0;
  let firstReserveViolation: number | null = input.startingSocPct < input.reserveSocPct ? 0 : null;
  const samples: { index: number; nominalKwh: number; planningKwh: number; arrivalSocPct: number; recoveredKwh: number }[] = [];

  input.segments.forEach((segment, index) => {
    const hours = segment.durationSeconds / 3600;
    let energyKwh = baselineEnergy(segment.distanceMeters / 1000, input.consumptionKwhPer100km).nominalKwh;
    let recoveredKwh = 0;
    if (input.model === "physics") {
      const distance = segment.distanceMeters;
      const speed = distance / segment.durationSeconds;
      const start = segment.startSpeedMps ?? speed;
      const end = segment.endSpeedMps ?? speed;
      // Integral of v^3 dt for linear speed. Constant averages cannot reconstruct stop/start driving.
      const meanCubeSpeed = (start ** 3 + start ** 2 * end + start * end ** 2 + end ** 3) / 4;
      const cosSlope = distance > 0 ? Math.sqrt(Math.max(0, 1 - (segment.elevationDeltaMeters / distance) ** 2)) : 1;
      const rollingJ = p.rollingResistance * p.massKg * 9.80665 * cosSlope * distance;
      const aeroJ = 0.5 * p.airDensityKgM3 * p.dragAreaM2 * meanCubeSpeed * segment.durationSeconds;
      const gradeJ = p.massKg * 9.80665 * segment.elevationDeltaMeters;
      const kineticJ = 0.5 * p.massKg * (end ** 2 - start ** 2);
      const wheelKwh = (rollingJ + aeroJ + gradeJ + kineticJ) / 3600000;
      const auxiliaryKwh = p.auxiliaryKw * hours;
      // Regen is limited at the battery boundary, including room made by auxiliaries in this sample.
      recoveredKwh = Math.min(Math.max(0, -wheelKwh) * p.regenEfficiency, p.maxRegenKw * hours,
        Math.max(0, input.usableBatteryKwh - storedKwh + auxiliaryKwh));
      energyKwh = Math.max(0, wheelKwh) / p.driveEfficiency - recoveredKwh + auxiliaryKwh;
    }
    // Never increase regenerative credit with an uncertainty margin.
    const planned = energyKwh >= 0 ? energyKwh * (1 + input.planningMarginFraction) : energyKwh;
    storedKwh -= planned;
    const soc = storedKwh / input.usableBatteryKwh * 100;
    minimumSocPct = Math.min(minimumSocPct, soc);
    if (firstReserveViolation === null && soc + 1e-9 < input.reserveSocPct) firstReserveViolation = index + 1;
    nominalKwh += energyKwh;
    planningKwh += planned;
    samples.push({ index: index + 1, nominalKwh: energyKwh, planningKwh: planned, arrivalSocPct: soc, recoveredKwh });
  });
  return {
    version: SIMULATION_MODEL.version, model: input.model, nominalKwh, planningKwh,
    finalSocPct: storedKwh / input.usableBatteryKwh * 100, minimumSocPct, firstReserveViolation,
    feasible: firstReserveViolation === null, samples,
    // Negative SOC is a model energy deficit; do not clamp it into an apparently feasible journey.
    energyDeficitKwh: Math.max(0, -minimumSocPct / 100 * input.usableBatteryKwh),
  };
}
