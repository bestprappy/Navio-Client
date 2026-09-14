import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { createStore } = await import("jotai");
const { createGuestTrip, guestTripAtom, isGuestPlanner } = await import("../app/feature/planner/_components/guest-planner.ts");
const { ensureItineraryDays } = await import("../app/feature/planner/planId/_components/itinerary/itinerary-days.ts");
const { applyGuestVehicleCommand, guestVehiclesAtom } = await import("../app/feature/planner/planId/_components/garage/guest-vehicles.ts");
const { isPublicPlannerRequest } = await import("../app/api/_lib/public-planner-request.ts");
const { customVehicleDefaults } = await import("../app/feature/planner/planId/_components/garage/data.ts");

test("guest trips have non-persisted IDs and isolated in-memory state", () => {
  const payload = { displayName: "Thailand", destinationCountry: "Thailand", destinationId: "bangkok", destinationName: "Bangkok", startDate: "2026-09-13", endDate: "2026-09-16" };
  const trip = createGuestTrip(payload);
  assert.ok(trip.id.startsWith("guest-"));
  assert.equal(isGuestPlanner(trip.id, false), true);
  assert.equal(isGuestPlanner(trip.id, true), true, "signing in cannot silently autosave a guest trip");
  assert.equal(isGuestPlanner("copied-101", false), true);
  assert.equal(isGuestPlanner("copied-101", true), false);
  assert.equal(isGuestPlanner("11111111-1111-4111-8111-111111111111", false), false, "saved IDs must not be opened as guest plans");
  const first = createStore(), second = createStore();
  first.set(guestTripAtom, trip);
  assert.equal(second.get(guestTripAtom), null);
  const days = ensureItineraryDays([], trip.startDate, trip.endDate);
  assert.deepEqual(days.map(day => day.date), ["2026-09-13", "2026-09-14", "2026-09-15", "2026-09-16"]);
});

test("temporary vehicles support selection, battery changes and removal without account storage", () => {
  const vehicle = { ...customVehicleDefaults, make: "Test", model: "EV", year: 2026, batteryCapacityKwh: 60, rangeKm: 400, consumptionKwhPer100km: 15, connectorTypes: ["CCS2"] };
  let vehicles = applyGuestVehicleCommand([], { kind: "custom", vehicle });
  const id = vehicles[0].id;
  vehicles = applyGuestVehicleCommand(vehicles, { kind: "update", id, patch: { settings: { startingBatteryPct: 65 } } });
  assert.equal(vehicles[0].settings.startingBatteryPct, 65);
  assert.equal(vehicles[0].settings.maxDcKw, vehicle.settings.maxDcKw);
  vehicles = applyGuestVehicleCommand(vehicles, { kind: "custom", vehicle });
  assert.equal(vehicles.filter(v => v.isDefault).length, 1);
  vehicles = applyGuestVehicleCommand(vehicles, { kind: "delete", id: vehicles[1].id });
  assert.equal(vehicles[0].isDefault, true);
  const store = createStore(); store.set(guestVehiclesAtom, vehicles);
  assert.deepEqual(createStore().get(guestVehiclesAtom), []);
});

test("public planning allowlist excludes account data and mutations", () => {
  assert.equal(isPublicPlannerRequest("GET", "/v1/geo/places/search?q=Bangkok"), true);
  assert.equal(isPublicPlannerRequest("POST", "/v1/routes/directions"), true);
  for (const path of ["/v1/trips", "/v1/trips/id/planner", "/v1/users/me/vehicles", "/v1/posts/id/vote", "/internal/v1/ev-route"]) {
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) assert.equal(isPublicPlannerRequest(method, path), false);
  }
  assert.equal(isPublicPlannerRequest("POST", "/v1/trips/currencies/rate"), false);
});
