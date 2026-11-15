import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";

registerHooks({resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:tsx?|mjs|js)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
}});
const { calculateEnergy, projectEnergyTrip } = await import("../../app/feature/planner/planId/_components/garage/energy-model.ts");
const { planningRangeKm, rangeReductionPct } = await import("../../app/feature/planner/planId/_components/garage/energy-policy.ts");
const { calcRangeKmForBatteryPct } = await import("../../app/feature/planner/planId/_components/garage/ev-calculator.ts");

test("every range standard and pack size gets the allowance without mutating factory data", () => {
  for (const ratedRangeStandard of ["NEDC", "WLTP", "EPA", "CLTC", "OTHER", "NONE"]) {
    for (const usableBatteryCapacityKwh of [10, 60, 120]) {
      const profile = { modelKind:"RATED_RANGE", ratedRangeKm:480, ratedRangeStandard,
        usableBatteryCapacityKwh, consumptionKwhPer100km:null };
      const before = structuredClone(profile);
      assert.equal(planningRangeKm(profile), 384);
      assert.equal(calcRangeKmForBatteryPct(50, {energyProfile:profile}), 192);
      assert.deepEqual(profile, before);
      const result = calculateEnergy({model:profile,distanceKm:384,distanceQuality:"ROUTED",departureSocPct:100});
      assert.ok(Math.abs(result.planningEnergyKwh - usableBatteryCapacityKwh) < 1e-9);
      assert.equal(result.rawPredictedArrivalSocPct,0);
    }
  }
});

test("a charging event replenishes physical capacity once, then adjusted driving carries to the next day", () => {
  const model = {modelKind:"RATED_RANGE",ratedRangeKm:480,usableBatteryCapacityKwh:60,consumptionKwhPer100km:null};
  const result = projectEnergyTrip(model,50,[
    {id:"charge",dayId:"one",distanceKm:96,distanceQuality:"ROUTED",charging:{targetSocPct:80,durationMinutes:null,compatible:true,effectivePowerKw:60}},
    {id:"next",dayId:"two",distanceKm:96,distanceQuality:"ROUTED"},
  ]);
  assert.equal(result[0].rawPredictedArrivalSocPct,25);
  assert.equal(result[0].chargeEnergyKwh,33);
  assert.equal(result[0].nominalChargeMinutes,33);
  assert.equal(result[1].startingSocPct,80);
  assert.equal(result[1].rawPredictedArrivalSocPct,55);
});

test("factory consumption has 20% less range; observed and unconfirmed inputs remain distinguishable", () => {
  const model={modelKind:"CONSUMPTION",ratedRangeKm:480,usableBatteryCapacityKwh:60,consumptionKwhPer100km:20};
  assert.equal(planningRangeKm({...model,consumptionSource:"REGULATORY_REPORTED"}),240);
  assert.equal(planningRangeKm({...model,consumptionSource:"USER_OBSERVED"}),300);
  assert.equal(rangeReductionPct({...model,consumptionSource:"UNKNOWN"}),0);
  assert.equal(planningRangeKm({...model,modelKind:"UNAVAILABLE"}),null);
});
