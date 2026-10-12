import assert from "node:assert/strict";
import { test } from "node:test";
import { energyAvailabilityLabel, energyBasisLabel, energyDisplayNumber } from "../../app/feature/planner/planId/_components/garage/energy-display.ts";

test("unknown values remain distinct from confirmed zero", () => {
  for (const value of [null, undefined, NaN, Infinity]) assert.equal(energyDisplayNumber(value, " kWh"), "Unavailable");
  assert.equal(energyDisplayNumber(0, " kWh"), "0 kWh");
  assert.equal(energyDisplayNumber(68, "%"), "68%");
});
test("partial routes and unknown capacity explain unavailable results", () => {
  assert.match(energyAvailabilityLabel(["DISTANCE_UNAVAILABLE", "USABLE_CAPACITY_UNAVAILABLE"]), /route distances/);
  assert.match(energyAvailabilityLabel(["USABLE_CAPACITY_UNAVAILABLE"]), /capacity is unconfirmed/);
  assert.equal(energyAvailabilityLabel([]), null);
});
test("rated range label never invents consumption and preserves its standard", () => {
  const car = { consumptionKwhPer100km: 18, energyProfile: { modelKind: "RATED_RANGE", selectionMode: "CATALOG_DEFAULT", ratedRangeKm: 480, ratedRangeStandard: "NEDC" } };
  assert.match(energyBasisLabel(car), /480 km NEDC/);
  assert.match(energyBasisLabel(car), /Provisional/);
  assert.doesNotMatch(energyBasisLabel(car), /kWh/);
});
test("custom observations do not acquire manufacturer provenance", () => {
  const car = { energyProfile: { modelKind: "CONSUMPTION", selectionMode: "USER_OVERRIDE", consumptionSource: "USER_OBSERVED", consumptionKwhPer100km: 15.2 } };
  assert.equal(energyBasisLabel(car), "User-observed average: 15.2 kWh/100 km");
});
test("legacy and unavailable profiles are explicitly identified", () => {
  assert.match(energyBasisLabel({}), /unconfirmed/);
  assert.match(energyBasisLabel({energyProfile: {selectionMode: "LEGACY_UNCONFIRMED", modelKind: "CONSUMPTION", consumptionKwhPer100km: 18}}), /unconfirmed/);
  assert.equal(energyBasisLabel({energyProfile: {modelKind: "UNAVAILABLE"}}), "Consumption unavailable");
});
