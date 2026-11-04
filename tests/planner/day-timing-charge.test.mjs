import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { calculateDaySchedule } = await import("../../app/feature/planner/planId/_components/itinerary/day-timing.ts");

const place = id => ({ id, type: "place", placeId: id, name: id, address: "", lat: 13, lng: 100, placeType: "museum" });
// Saved with the rough figure a manual stop starts with, 50 minutes, though its real charge is 24.
const charger = { ...place("charger"), placeId: "ev-charger:station", evCharger: { connectorTypes: ["CCS2"], maxKw: 120, totalConnectors: 2, availableConnectors: null, priceText: null, openingHoursSummary: null, estimatedChargeMinutes: 50, operatorName: null, targetBatteryPct: 100 } };
const stops = [place("first"), charger, place("after")];
const travel = new Map([["charger", 30], ["after", 30]]);

test("calculated times use the same charge duration the stop's Takes figure shows", () => {
  const { updates } = calculateDaySchedule({ stops, travelMinutesByItemId: travel, startsFromAnchor: false, chargeMinutesByItemId: new Map([["charger", 24]]) });
  // first: 9:00 plus a typical visit, then 30 travel, 24 charging, 30 travel.
  const first = updates.get("first");
  const [h, m] = first.timeEnd.split(":").map(Number);
  const expected = h * 60 + m + 30 + 24 + 30;
  assert.equal(updates.get("after").time, `${String(Math.floor(expected / 60)).padStart(2, "0")}:${String(expected % 60).padStart(2, "0")}`);
});

test("a saved duration still counts when no projection is available", () => {
  const { updates } = calculateDaySchedule({ stops, travelMinutesByItemId: travel, startsFromAnchor: false });
  const [h, m] = updates.get("first").timeEnd.split(":").map(Number);
  const expected = h * 60 + m + 30 + 50 + 30;
  assert.equal(updates.get("after").time, `${String(Math.floor(expected / 60)).padStart(2, "0")}:${String(expected % 60).padStart(2, "0")}`);
});

test("a stop whose charge cannot be projected falls back to its saved duration rather than stopping the day", () => {
  const { updates, issues } = calculateDaySchedule({ stops, travelMinutesByItemId: travel, startsFromAnchor: false, chargeMinutesByItemId: new Map([["charger", null]]) });
  assert.equal(issues.length, 0);
  assert.ok(updates.has("after"));
});

test("a stop that adds no charge takes no charging time", () => {
  const { updates } = calculateDaySchedule({ stops, travelMinutesByItemId: travel, startsFromAnchor: false, chargeMinutesByItemId: new Map([["charger", 0]]) });
  const [h, m] = updates.get("first").timeEnd.split(":").map(Number);
  const expected = h * 60 + m + 30 + 0 + 30;
  assert.equal(updates.get("after").time, `${String(Math.floor(expected / 60)).padStart(2, "0")}:${String(expected % 60).padStart(2, "0")}`);
});
