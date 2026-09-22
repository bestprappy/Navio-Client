// node --experimental-transform-types --test tests/garage/api.test.mjs
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { executeVehicleCommand, listVehicles, listVehicleCatalog, customVehicleSchema } from "../../app/feature/planner/planId/_components/garage/vehicle-api.ts";
import { savedVehicleFixture, catalogFixture } from "./data.ts";

const originalFetch = globalThis.fetch;
const originalError = console.error;
afterEach(() => { globalThis.fetch = originalFetch; console.error = originalError; });

test("loads persisted selection, charging limits, battery and source data", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/users/me/vehicles");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    return Response.json([savedVehicleFixture]);
  };
  const [vehicle] = await listVehicles();
  assert.equal(vehicle.isDefault, true);
  assert.equal(vehicle.settings.startingBatteryPct, 65);
  assert.equal(vehicle.settings.maxAcKw, 7);
  assert.equal(vehicle.catalog.market, "TH");
});

test("catalogue requests use official identifiers without posting browser specifications", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/users/me/vehicles/catalog/th-byd-atto-3-extended-2026");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { consumptionKwhPer100km: 17.5, startingBatteryPct: 80 });
    return Response.json(savedVehicleFixture, { status: 201 });
  };
  await executeVehicleCommand({ kind: "catalog", catalogId: catalogFixture.id, catalogVehicle: catalogFixture, consumptionKwhPer100km: 17.5, startingBatteryPct: 80 });
});

test("patches only the changed vehicle settings", async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), { settings: { startingBatteryPct: 0 } });
    return Response.json({ ...savedVehicleFixture, settings: { ...savedVehicleFixture.settings, startingBatteryPct: 0 } });
  };
  const vehicle = await executeVehicleCommand({ kind: "update", id: savedVehicleFixture.id, patch: { settings: { startingBatteryPct: 0 } } });
  assert.equal(vehicle.settings.startingBatteryPct, 0);
});

test("successful deletion accepts an empty 204 response", async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, "DELETE");
    return new Response(null, { status: 204 });
  };
  assert.equal(await executeVehicleCommand({ kind: "delete", id: savedVehicleFixture.id }), null);
});

test("unknown source values remain null instead of becoming invented specifications", async () => {
  globalThis.fetch = async () => Response.json([{ ...catalogFixture, year: null, maxAcKw: null }]);
  const [vehicle] = await listVehicleCatalog();
  assert.equal(vehicle.year, null);
  assert.equal(vehicle.maxAcKw, null);
  assert.equal("consumptionKwhPer100km" in vehicle, false);
});

test("empty garages load normally and malformed responses fail visibly", async () => {
  console.error = () => {};
  globalThis.fetch = async () => Response.json([]);
  assert.deepEqual(await listVehicles(), []);
  globalThis.fetch = async () => Response.json([{ id: "not-a-vehicle" }]);
  await assert.rejects(listVehicles(), /unexpected response/);
});

test("session, network, timeout and gateway failures never simulate successful saves", async () => {
  console.error = () => {};
  globalThis.fetch = async () => Response.json({}, { status: 401 });
  await assert.rejects(listVehicles(), /sign in again/);
  globalThis.fetch = async () => new Response("Bad gateway", { status: 502 });
  await assert.rejects(listVehicles(), /temporarily unavailable/);
  globalThis.fetch = async () => { throw new TypeError("offline"); };
  await assert.rejects(listVehicles(), /Check your connection/);
  globalThis.fetch = async () => { throw new DOMException("timeout", "TimeoutError"); };
  await assert.rejects(listVehicles(), /Check your connection/);
});

test("validation messages identify invalid fields and conflicts preserve the saved record", async () => {
  console.error = () => {};
  globalThis.fetch = async () => Response.json({ message: "Validation failed", validationErrors: { "settings.startingBatteryPct": "Battery must be at most 100" } }, { status: 400 });
  await assert.rejects(listVehicles(), /Battery must be at most 100/);
  globalThis.fetch = async () => Response.json({}, { status: 409 });
  await assert.rejects(executeVehicleCommand({ kind: "delete", id: savedVehicleFixture.id }), /changed elsewhere/);
});

test("cancelled queries do not log a network failure", async () => {
  let logged = false;
  console.error = () => { logged = true; };
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async () => { throw controller.signal.reason; };
  await assert.rejects(listVehicles(controller.signal));
  assert.equal(logged, false);
});

test("custom forms reject blank names, invalid battery, empty connectors and unsafe image URLs", () => {
  const valid = { ...savedVehicleFixture, nickname: "", settings: savedVehicleFixture.settings };
  assert.equal(customVehicleSchema.safeParse(valid).success, true);
  for (const change of [{ make: " " }, { batteryCapacityKwh: 0 }, { year: 2026.5 }, { connectorTypes: [] }, { settings: { ...valid.settings, imageUrl: "javascript:alert(1)" } }]) {
    assert.equal(customVehicleSchema.safeParse({ ...valid, ...change }).success, false);
  }
});
