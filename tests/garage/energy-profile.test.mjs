import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { savedVehicleSchema, vehicleCatalogSchema, legacyEnergyProfile, executeVehicleCommand, userObservedConsumption } = await import("../../app/feature/planner/planId/_components/garage/vehicle-api.ts");
const { savedVehicleForPlanner } = await import("../../app/feature/planner/planId/_components/garage/vehicle-mappers.ts");
const { savedVehicleFixture, catalogFixture } = await import("./data.ts");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("legacy data carries unknown provenance without changing calculation inputs", () => {
  const saved = savedVehicleSchema.parse(savedVehicleFixture);
  const mapped = savedVehicleForPlanner(saved).car;
  assert.equal(mapped.consumptionKwhPer100km, 17.5);
  assert.equal(mapped.batteryKwh, 60.48);
  assert.equal(mapped.energyProfile.selectionMode, "LEGACY_UNCONFIRMED");
  assert.equal(mapped.energyProfile.consumptionSource, "UNKNOWN");
  assert.equal(mapped.energyProfile.consumptionStandard, "NONE");
  assert.equal(mapped.energyProfile.ratedRangeStandard, "NEDC");
  assert.equal(mapped.energyProfile.sourceUrl, null);
  assert.equal(mapped.energyProfile.usableBatteryCapacityKwh, null);
  assert.equal(saved.energyProfile, undefined);
});

test("catalogue profile preserves range context separately from consumption evidence", () => {
  const energyProfile = { ...legacyEnergyProfile(savedVehicleFixture), modelKind: "RATED_RANGE", selectionMode: "CATALOG_DEFAULT", consumptionKwhPer100km: null };
  const parsed = vehicleCatalogSchema.parse({ ...catalogFixture, energyProfile });
  assert.equal(parsed.sourceUrl, catalogFixture.sourceUrl);
  assert.equal(parsed.energyProfile.sourceUrl, null);
  assert.equal(parsed.energyProfile.ratedRangeStandard, "NEDC");
  assert.equal(parsed.energyProfile.consumptionStandard, "NONE");
  assert.equal(parsed.energyProfile.capacityBasis, "MANUFACTURER_DECLARED_UNSPECIFIED");
});

test("observed metadata passes through API serialization and planner mapping", async () => {
  const energyProfile = { ...legacyEnergyProfile(savedVehicleFixture), selectionMode: "USER_OVERRIDE", consumptionSource: "USER_OBSERVED" };
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.consumptionProvenance, userObservedConsumption);
    return Response.json({ ...savedVehicleFixture, energyProfile });
  };
  const saved = await executeVehicleCommand({ kind: "update", id: savedVehicleFixture.id, patch: {
    consumptionKwhPer100km: 17.5, consumptionProvenance: userObservedConsumption,
  } });
  assert.deepEqual(savedVehicleForPlanner(saved).car.energyProfile, energyProfile);
  assert.equal(saved.energyProfile.consumptionMeasurementBasis, "UNKNOWN");
});
