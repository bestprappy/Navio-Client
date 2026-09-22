import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { defaultEnergyProfile, canAutomaticallyPlan } = await import("../../app/feature/planner/planId/_components/garage/energy-selection.ts");
const { applyGuestVehicleCommand } = await import("../../app/feature/planner/planId/_components/garage/guest-vehicles.ts");
const { savedVehicleForPlanner } = await import("../../app/feature/planner/planId/_components/garage/vehicle-mappers.ts");
const { executeVehicleCommand, savedVehicleSchema } = await import("../../app/feature/planner/planId/_components/garage/vehicle-api.ts");
const { catalogFixture, savedVehicleFixture } = await import("./data.ts");
const { createStore } = await import("jotai");
const { garageVehiclesSnapshotAtom, garageActiveIdSnapshotAtom, activeEvCarAtom, calculationEvCarAtom, startingBatteryOverridesAtom, startingBatteryPctAtom, activeVehicleAtom } = await import("../../app/feature/planner/planId/_components/garage/garage.atoms.ts");
const { autoAddEvChargersToBlockAtom } = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
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

test("guest range default preserves selection and source context without consumption or account calls", () => {
  globalThis.fetch = () => { throw new Error("No guest account requests"); };
  const [saved] = applyGuestVehicleCommand([], catalogCommand(catalogFixture));
  assert.equal(saved.consumptionKwhPer100km, null);
  assert.equal(saved.energyProfile.modelKind, "RATED_RANGE");
  assert.equal(saved.energyProfile.selectionMode, "CATALOG_DEFAULT");
  assert.equal(saved.energyProfile.ratedRangeStandard, "NEDC");
  assert.equal(saved.energyProfile.consumptionStandard, "NONE");
  assert.equal(saved.energyProfile.usableBatteryCapacityKwh, null);
  assert.equal(saved.isDefault, true);
  assert.equal(canAutomaticallyPlan(plannerCar(saved)), false);
  assert.deepEqual(savedVehicleSchema.parse(JSON.parse(JSON.stringify(saved))).energyProfile, saved.energyProfile);
});

test("suitable direct default, observed override, and reset have explicit precedence", () => {
  let [saved] = applyGuestVehicleCommand([], catalogCommand(directCatalog()));
  assert.equal(saved.consumptionKwhPer100km, 15.2);
  assert.equal(saved.energyProfile.consumptionStandard, "WLTP");
  assert.equal(saved.energyProfile.ratedRangeStandard, "NEDC");
  [saved] = applyGuestVehicleCommand([saved], { kind: "update", id: saved.id,
    patch: { energySelection: "USER_OVERRIDE", consumptionKwhPer100km: 18.125 } });
  assert.equal(saved.consumptionKwhPer100km, 18.125);
  assert.equal(saved.energyProfile.consumptionSource, "USER_OBSERVED");
  assert.equal(saved.energyProfile.consumptionMeasurementBasis, "UNKNOWN");
  assert.equal(saved.energyProfile.sourceUrl, null);
  assert.equal(saved.energyProfile.usableBatteryCapacityKwh, 58);
  [saved] = applyGuestVehicleCommand([saved], { kind: "update", id: saved.id, patch: { energySelection: "RESET_DEFAULT" } });
  assert.equal(saved.consumptionKwhPer100km, 15.2);
  assert.equal(saved.energyProfile.sourceUrl, "https://example.com/consumption");
});

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

test("legacy confirmation never reclassifies or recalculates, and edits invalidate confirmation", () => {
  const legacy = { ...savedVehicleFixture, consumptionKwhPer100km: 17.537 };
  assert.equal(canAutomaticallyPlan(plannerCar(legacy)), false);
  let [saved] = applyGuestVehicleCommand([legacy], { kind: "update", id: legacy.id, patch: { energySelection: "CONFIRM_LEGACY" } });
  assert.equal(saved.consumptionKwhPer100km, 17.537);
  assert.equal(plannerCar(saved).energyProfile.consumptionSource, "UNKNOWN");
  assert.equal(canAutomaticallyPlan(plannerCar(saved)), true);
  [saved] = applyGuestVehicleCommand([saved], { kind: "update", id: saved.id, patch: { consumptionKwhPer100km: 19 } });
  assert.equal(saved.legacyConsumptionConfirmed, false);
  assert.equal(canAutomaticallyPlan(plannerCar(saved)), false);
});

test("custom vehicle supports range default and observed override, with reset and unrelated settings intact", () => {
  const input = { nickname: "Custom", make: "Test", model: "EV", year: 2026,
    batteryCapacityKwh: 60, rangeKm: 400, consumptionKwhPer100km: null, connectorTypes: ["CCS2"],
    settings: savedVehicleFixture.settings, energySelection: "USE_DEFAULT" };
  let [saved] = applyGuestVehicleCommand([], { kind: "custom", vehicle: input });
  assert.equal(saved.catalog, null);
  assert.equal(saved.energyProfile.modelKind, "RATED_RANGE");
  [saved] = applyGuestVehicleCommand([saved], { kind: "update", id: saved.id,
    patch: { energySelection: "USER_OVERRIDE", consumptionKwhPer100km: 17 } });
  assert.equal(saved.energyProfile.consumptionSource, "USER_OBSERVED");
  [saved] = applyGuestVehicleCommand([saved], { kind: "update", id: saved.id,
    patch: { energySelection: "RESET_DEFAULT", nickname: "New name", settings: { startingBatteryPct: 50 } } });
  assert.equal(saved.consumptionKwhPer100km, null);
  assert.equal(saved.nickname, "New name");
  assert.equal(saved.settings.startingBatteryPct, 50);
  assert.equal(saved.settings.maxDcKw, savedVehicleFixture.settings.maxDcKw);
});

test("authenticated default posts only command/id and accepts null-consumption profile on reload", async () => {
  const [response] = applyGuestVehicleCommand([], catalogCommand(catalogFixture));
  globalThis.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { startingBatteryPct: 80, energySelection: "USE_DEFAULT" });
    return Response.json(response);
  };
  const saved = await executeVehicleCommand(catalogCommand(catalogFixture));
  assert.equal(saved.energyProfile.modelKind, "RATED_RANGE");
  assert.equal(saved.consumptionKwhPer100km, null);
});

test("range vehicle stays active for identity/connectors but never enters the consumption calculator", () => {
  const [saved] = applyGuestVehicleCommand([], catalogCommand(catalogFixture));
  const store = createStore();
  store.set(garageVehiclesSnapshotAtom, [savedVehicleForPlanner(saved)]);
  store.set(garageActiveIdSnapshotAtom, saved.id);
  assert.equal(store.get(activeEvCarAtom).energyProfile.modelKind, "RATED_RANGE");
  assert.deepEqual(store.get(activeEvCarAtom).connectorTypes, catalogFixture.connectorTypes);
  assert.equal(store.get(calculationEvCarAtom), null);
  // Guard lives at the mutation boundary too, not only on a disabled button.
  assert.equal(store.set(autoAddEvChargersToBlockAtom, { blockId: "day", insertions: [null] }), 0);
  store.set(garageVehiclesSnapshotAtom, [savedVehicleForPlanner(savedVehicleFixture)]);
  store.set(garageActiveIdSnapshotAtom, savedVehicleFixture.id);
  assert.equal(store.get(calculationEvCarAtom).consumptionKwhPer100km, 17.5);
  assert.equal(store.set(autoAddEvChargersToBlockAtom, { blockId: "day", insertions: [null] }), 0);
});

test("live starting battery reaches trip consumers immediately without editing saved settings", () => {
  const store = createStore();
  const vehicle = savedVehicleForPlanner(savedVehicleFixture);
  store.set(garageVehiclesSnapshotAtom, [vehicle]);
  store.set(garageActiveIdSnapshotAtom, vehicle.id);
  store.set(startingBatteryOverridesAtom, { [vehicle.id]: 35 });
  assert.equal(store.get(startingBatteryPctAtom), 35);
  assert.equal(store.get(activeVehicleAtom).startingBatteryPct, 35);
  assert.equal(store.get(garageVehiclesSnapshotAtom)[0].startingBatteryPct, 65);
  store.set(garageVehiclesSnapshotAtom, [vehicle]);
  assert.equal(store.get(startingBatteryPctAtom), 35, "a refetch cannot overwrite a live gesture");
  assert.equal(createStore().get(startingBatteryOverridesAtom)[vehicle.id], undefined);
});


test("explicit NAVIO Estimate selects rated range even with direct consumption and survives reload", () => {
  let [saved] = applyGuestVehicleCommand([], catalogCommand(directCatalog()));
  [saved] = applyGuestVehicleCommand([saved], { kind: "update", id: saved.id, patch: { energySelection: "USE_RATED_RANGE" } });
  const reloaded = savedVehicleSchema.parse(JSON.parse(JSON.stringify(saved)));
  assert.equal(reloaded.energyProfile.modelKind, "RATED_RANGE");
  assert.equal(reloaded.consumptionKwhPer100km, null);
  assert.equal(reloaded.energyProfile.consumptionStandard, "NONE");
  assert.equal(reloaded.energyProfile.sourceUrl, null);
  assert.equal(reloaded.energyProfile.ratedRangeStandard, "NEDC");
  assert.equal(canAutomaticallyPlan(plannerCar(reloaded)), false);
  assert.throws(() => applyGuestVehicleCommand([{ ...saved, catalog: null, rangeKm: null }], {
    kind: "update", id: saved.id, patch: { energySelection: "USE_RATED_RANGE" },
  }), /rangeKm/);
});
