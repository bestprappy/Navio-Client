import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { savedVehicleSchema, vehicleCatalogSchema, legacyEnergyProfile, executeVehicleCommand, userObservedConsumption } = await import("../../app/feature/planner/planId/_components/garage/vehicle-api.ts");
const { savedVehicleForPlanner } = await import("../../app/feature/planner/planId/_components/garage/vehicle-mappers.ts");
const { applyGuestVehicleCommand } = await import("../../app/feature/planner/planId/_components/garage/guest-vehicles.ts");
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

test("guest provenance survives unrelated updates and clears on unqualified consumption writes", () => {
  let vehicles = applyGuestVehicleCommand([savedVehicleFixture], { kind: "update", id: savedVehicleFixture.id, patch: {
    consumptionKwhPer100km: 18.125, consumptionProvenance: userObservedConsumption,
  } });
  const profile = vehicles[0].energyProfile;
  vehicles = applyGuestVehicleCommand(vehicles, { kind: "update", id: savedVehicleFixture.id, patch: { nickname: "Daily", settings: { startingBatteryPct: 40 } } });
  assert.deepEqual(vehicles[0].energyProfile, profile);
  assert.equal(vehicles[0].consumptionKwhPer100km, 18.125);
  vehicles = applyGuestVehicleCommand(vehicles, { kind: "update", id: savedVehicleFixture.id, patch: { consumptionKwhPer100km: 19 } });
  assert.equal(vehicles[0].energyProfile.consumptionSource, "UNKNOWN");
  assert.equal(vehicles[0].energyProfile.consumptionKwhPer100km, 19);
});

test("guest catalogue selection copies specifications without any account requests", () => {
  globalThis.fetch = () => { throw new Error("Guest selection must not call an account API"); };
  const energyProfile = { ...legacyEnergyProfile(savedVehicleFixture), modelKind: "RATED_RANGE", selectionMode: "CATALOG_DEFAULT", consumptionKwhPer100km: null };
  const catalog = { ...catalogFixture, energyProfile };
  const command = { kind: "catalog", catalogId: catalog.id, catalogVehicle: catalog, consumptionKwhPer100km: 18, startingBatteryPct: 80 };
  const [saved] = applyGuestVehicleCommand([], command);
  assert.notEqual(saved.id, catalog.id);
  assert.deepEqual(saved.catalog, catalog);
  assert.notEqual(saved.catalog, catalog, "temporary state has a parsed copy");
  assert.equal(saved.batteryCapacityKwh, catalog.batteryCapacityKwh);
  assert.equal(saved.rangeKm, catalog.rangeKm);
  assert.deepEqual(saved.connectorTypes, catalog.connectorTypes);
  assert.equal(saved.settings.maxAcKw, catalog.maxAcKw);
  assert.equal(saved.settings.maxDcKw, catalog.maxDcKw);
  assert.equal(saved.settings.imageUrl, catalog.imageUrl);
  assert.equal(saved.energyProfile.selectionMode, "LEGACY_UNCONFIRMED");
  assert.equal(saved.energyProfile.consumptionSource, "UNKNOWN", "old derived consumption is not observed");
  const [observed] = applyGuestVehicleCommand([], { ...command, consumptionKwhPer100km: 17.25, consumptionProvenance: userObservedConsumption });
  assert.equal(observed.energyProfile.consumptionSource, "USER_OBSERVED");
  assert.equal(observed.energyProfile.consumptionMeasurementBasis, "UNKNOWN");
  assert.deepEqual(observed.catalog.energyProfile, energyProfile);
  assert.throws(() => applyGuestVehicleCommand([], { ...command, catalogId: "different" }));
});
