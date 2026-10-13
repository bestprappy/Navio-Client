import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { defaultEnergyProfile, canAutomaticallyPlan } = await import("../../app/feature/planner/planId/_components/garage/energy-selection.ts");
const { savedVehicleForPlanner } = await import("../../app/feature/planner/planId/_components/garage/vehicle-mappers.ts");
const { executeVehicleCommand, savedVehicleSchema } = await import("../../app/feature/planner/planId/_components/garage/vehicle-api.ts");
const { catalogFixture, savedVehicleFixture } = await import("./data.ts");
const { createStore } = await import("jotai");
const { garageVehiclesSnapshotAtom, garageActiveIdSnapshotAtom, activeEvCarAtom, calculationEvCarAtom, startingBatteryPctAtom, activeVehicleAtom } = await import("../../app/feature/planner/planId/_components/garage/garage.atoms.ts");
const { tripEnergyStateAtom } = await import("../../app/feature/planner/planId/_components/garage/trip-energy-state.ts");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const catalogCommand = catalog => ({ kind: "catalog", catalogId: catalog.id, catalogVehicle: catalog,
  startingBatteryPct: 80, energySelection: "USE_DEFAULT" });
const plannerCar = saved => {
  const mapped = savedVehicleForPlanner(saved);
  return mapped.source === "preset" ? mapped.car : mapped.customCar;
};
const directCatalog = () => ({ ...catalogFixture, energyProfile: {
  ...defaultEnergyProfile(catalogFixture, null), modelKind: "CONSUMPTION", consumptionKwhPer100km: 15.2,
  consumptionSource: "REGULATORY_REPORTED", consumptionMeasurementBasis: "BATTERY_SIDE",
  consumptionStandard: "WLTP", sourceUrl: "https://example.com/consumption", usableBatteryCapacityKwh: 58,
} });

test("wall-side, unknown basis, and absent consumption evidence fall back without invented capacity", () => {
  for (const patch of [{ consumptionMeasurementBasis: "WALL_SIDE" }, { consumptionMeasurementBasis: "UNKNOWN" }, { sourceUrl: null }, { consumptionSource: "UNKNOWN" }]) {
    const catalog = directCatalog();
    catalog.energyProfile = { ...catalog.energyProfile, ...patch, usableBatteryCapacityKwh: null };
    const profile = defaultEnergyProfile(catalog, null);
    assert.equal(profile.modelKind, "RATED_RANGE");
    assert.equal(profile.consumptionKwhPer100km, null);
    assert.equal(profile.usableBatteryCapacityKwh, null);
    assert.equal(profile.sourceUrl, null);
  }
  const unavailable = defaultEnergyProfile(null, null);
  assert.equal(unavailable.modelKind, "UNAVAILABLE");
  assert.equal(unavailable.consumptionKwhPer100km, null);
});

test("live starting battery reaches trip consumers immediately without editing saved settings", () => {
  const store = createStore();
  const vehicle = savedVehicleForPlanner(savedVehicleFixture);
  store.set(garageVehiclesSnapshotAtom, [vehicle]);
  store.set(garageActiveIdSnapshotAtom, vehicle.id);
  store.set(tripEnergyStateAtom, { initialSocPct: 35, vehicleSnapshot: null });
  assert.equal(store.get(startingBatteryPctAtom), 35);
  assert.equal(store.get(activeVehicleAtom).startingBatteryPct, 65);
  assert.equal(store.get(garageVehiclesSnapshotAtom)[0].startingBatteryPct, 65);
  store.set(garageVehiclesSnapshotAtom, [vehicle]);
  assert.equal(store.get(startingBatteryPctAtom), 35, "a refetch cannot overwrite a live gesture");
  assert.equal(createStore().get(tripEnergyStateAtom), undefined);
});


test("suitable direct default keeps consumption evidence separate from rated range", () => {
  const profile = defaultEnergyProfile(directCatalog(), null);
  assert.equal(profile.modelKind, "CONSUMPTION");
  assert.equal(profile.consumptionKwhPer100km, 15.2);
  assert.equal(profile.consumptionStandard, "WLTP");
  assert.equal(profile.ratedRangeStandard, "NEDC");
  assert.equal(profile.usableBatteryCapacityKwh, 58);
  assert.equal(profile.sourceUrl, "https://example.com/consumption");
  const range = defaultEnergyProfile(directCatalog(), null, true);
  assert.equal(range.modelKind, "RATED_RANGE");
  assert.equal(range.consumptionKwhPer100km, null);
  assert.equal(range.sourceUrl, null);
});

test("legacy consumption requires confirmation before automatic planning", () => {
  const mapped = plannerCar(savedVehicleFixture);
  assert.equal(canAutomaticallyPlan(mapped), false);
  assert.equal(canAutomaticallyPlan({ ...mapped, legacyConsumptionConfirmed: true }), true);
  assert.equal(canAutomaticallyPlan({ ...mapped, legacyConsumptionConfirmed: true, consumptionKwhPer100km: 0 }), false);
});

test("account catalogue command preserves the returned range profile on reload and in planner state", async () => {
  const response = savedVehicleSchema.parse({ ...savedVehicleFixture, consumptionKwhPer100km: null,
    energyProfile: defaultEnergyProfile(catalogFixture, null) });
  globalThis.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { startingBatteryPct: 80, energySelection: "USE_DEFAULT" });
    return Response.json(response);
  };
  const saved = await executeVehicleCommand(catalogCommand(catalogFixture));
  assert.equal(saved.consumptionKwhPer100km, null);
  assert.equal(saved.energyProfile.modelKind, "RATED_RANGE");
  assert.equal(saved.energyProfile.ratedRangeStandard, "NEDC");
  assert.deepEqual(savedVehicleSchema.parse(JSON.parse(JSON.stringify(saved))).energyProfile, saved.energyProfile);
  const store = createStore();
  store.set(garageVehiclesSnapshotAtom, [savedVehicleForPlanner(saved)]);
  store.set(garageActiveIdSnapshotAtom, saved.id);
  assert.deepEqual(store.get(activeEvCarAtom).connectorTypes, catalogFixture.connectorTypes);
  assert.equal(store.get(calculationEvCarAtom), null);
  assert.equal(canAutomaticallyPlan(store.get(activeEvCarAtom)), false);
});
