import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { calculateEnergy, projectEnergyTrip } from "../../app/feature/planner/planId/_components/garage/energy-model.ts";
const fixtureText = readFileSync(new URL("./fixtures/energy-v1.json", import.meta.url), "utf8");
const fixtures = JSON.parse(fixtureText);
for (const fixture of fixtures.trips) test(`shared trip: ${fixture.name}`, () => {
  const results = projectEnergyTrip(fixture.model, fixture.initialSocPct, fixture.stops);
  fixture.expected.forEach((expected, index) => {
    for (const [field, value] of Object.entries(expected)) {
      if (typeof value === "number") assert.ok(Math.abs(results[index][field] - value) <= fixtures.tolerance, field);
      else assert.equal(results[index][field], value, field);
    }
  });
});
for (const fixture of fixtures.cases) test(`golden: ${fixture.name}`, () => {
  const result = calculateEnergy(fixture.input);
  for (const [field, expected] of Object.entries(fixture.expected)) {
    if (typeof expected === "number") assert.ok(typeof result[field] === "number" && Math.abs(result[field] - expected) <= fixtures.tolerance, field);
    else assert.equal(result[field], expected, field);
  }
  assert.equal(result.uncertaintyAllowance, null);
  assert.equal(result.uncertaintyStatus, "UNCALIBRATED");
});
test("Java and TypeScript ship identical golden fixtures", () => {
  assert.equal(fixtureText, readFileSync(new URL("../../../server/mobility-and-ev-service/src/test/resources/energy/energy-v1.json", import.meta.url), "utf8"));
});
test("observations, removal, multiple days, zero and recovery preserve prediction history", () => {
  const model = { modelKind: "RATED_RANGE", ratedRangeKm: 100, consumptionKwhPer100km: null, usableBatteryCapacityKwh: null };
  const stop = (id, dayId, distanceKm, observedSocPct = null) => ({ id, dayId, distanceKm, observedSocPct, distanceQuality: "ROUTED" });
  const stops = [stop("a", "day1", 28, 68), stop("b", "day2", 10, 50), stop("c", "day2", 10)];
  const result = projectEnergyTrip(model, 100, stops);
  assert.equal(result[0].rawPredictedArrivalSocPct, 72);
  assert.equal(result[0].departureSocPct, 68);
  assert.equal(result[1].startingSocPct, 68);
  assert.equal(result[2].departureSocPct, 40);
  assert.equal(projectEnergyTrip(model, 100, [{ ...stops[0], observedSocPct: null }, ...stops.slice(1)])[1].rawPredictedArrivalSocPct, 62);
  const recovered = projectEnergyTrip(model, 73, [stop("a", "d1", 80), stop("b", "d2", 10, 0), stop("c", "d3", 0)]);
  assert.equal(recovered[0].predictedLegFeasibility, "INFEASIBLE");
  assert.equal(recovered[1].rawPredictedArrivalSocPct, null);
  assert.equal(recovered[2].departureSocPct, 0);
  assert.throws(() => projectEnergyTrip(model, 101, []));
  assert.throws(() => projectEnergyTrip(model, 100, [stop("a", "d1", 0, -1)]));
});
test("splitting legs does not accumulate rounded depletion", () => {
  const model = fixtures.cases[0].input.model;
  const stops = Array.from({ length: 100 }, (_, id) => ({ id: String(id), dayId: "day", distanceKm: 0.9, distanceQuality: "ROUTED" }));
  const split = projectEnergyTrip(model, 80, stops).at(-1).departureSocPct;
  assert.ok(Math.abs(split - calculateEnergy(fixtures.cases[0].input).departureSocPct) < fixtures.tolerance);
});
