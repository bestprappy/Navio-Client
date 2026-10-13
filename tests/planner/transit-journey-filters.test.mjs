import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { getAvailableVehicleKinds, getJourneyVehicleKinds, filterTransitJourneys, sortTransitJourneys, canSortByFare } =
  await import("../../app/feature/planner/planId/_components/routes/transit-journey-filters.ts");

const walk = seconds => ({ travelMode: "walk", geometry: { type: "LineString", coordinates: [] }, durationSeconds: seconds });
const ride = vehicleType => ({ travelMode: "transit", geometry: { type: "LineString", coordinates: [] }, durationSeconds: 600,
  line: { name: vehicleType, vehicleType }, departureStop: "A", arrivalStop: "B" });
const journey = (id, durationSeconds, walkingSeconds, rides, fare = null) => ({ id, provider: "GOOGLE",
  geometry: { type: "LineString", coordinates: [] }, durationSeconds, walkingSeconds, fare, currency: fare == null ? null : "TWD",
  steps: [walk(walkingSeconds), ...rides.map(ride)] });

const directBus = journey("bus", 4140, 420, ["BUS"], 110);
const busTransfer = journey("bus-transfer", 4560, 360, ["BUS", "BUS"], 148);
const airportMetro = journey("metro", 3720, 1380, ["SUBWAY"]);
const metroAndBus = journey("mixed", 3900, 300, ["SUBWAY", "INTERCITY_BUS", "FERRY"]);
const journeys = [directBus, busTransfer, airportMetro, metroAndBus];

test("vehicle filters only list vehicles that the found routes actually use", () => {
  assert.deepEqual(getAvailableVehicleKinds([directBus, busTransfer]), [{ kind: "Bus", count: 2 }]);
  assert.deepEqual(getAvailableVehicleKinds(journeys).map(item => [item.kind, item.count]), [["Metro", 2], ["Bus", 3], ["Ferry", 1]]);
  assert.deepEqual(getJourneyVehicleKinds(metroAndBus), ["Metro", "Bus", "Ferry"]);
});

test("a vehicle filter keeps every route that rides that vehicle, including mixed ones", () => {
  assert.deepEqual(filterTransitJourneys(journeys, "Metro").map(item => item.id), ["metro", "mixed"]);
  assert.deepEqual(filterTransitJourneys(journeys, null), journeys);
});

test("fastest is ordered by total travel time", () => {
  assert.deepEqual(sortTransitJourneys(journeys, "fastest").map(item => item.id), ["metro", "mixed", "bus", "bus-transfer"]);
});

test("least walking, fewest transfers and lowest fare each reorder the routes and break ties by speed", () => {
  assert.deepEqual(sortTransitJourneys(journeys, "least-walking").map(item => item.id), ["mixed", "bus-transfer", "bus", "metro"]);
  assert.deepEqual(sortTransitJourneys(journeys, "fewest-transfers").map(item => item.id), ["metro", "bus", "bus-transfer", "mixed"]);
  assert.deepEqual(sortTransitJourneys(journeys, "lowest-fare").map(item => item.id), ["bus", "bus-transfer", "metro", "mixed"]);
});

test("fare sorting is only offered when at least two routes publish a fare", () => {
  assert.equal(canSortByFare(journeys), true);
  assert.equal(canSortByFare([directBus, airportMetro]), false);
});
