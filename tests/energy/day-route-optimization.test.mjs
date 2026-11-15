import assert from "node:assert/strict";
import { test } from "node:test";
import { dayOrderCandidates, movable, routeMetrics, routeScore, meaningfulImprovement } from "../../app/feature/planner/planId/_components/charger/day-route-optimization.ts";

const place = id => ({ id, type: "place", name: id, placeId: id, lat: 13, lng: 100 });
const day = items => ({ id: "day-2", kind: "itinerary", items });
test("reordering preserves every stop and its details and never moves endpoints", () => {
  const original = day([place("a"), place("b"), place("c"), place("d")]);
  const [candidate] = dayOrderCandidates(original, false);
  assert.deepEqual(candidate.items.map(i => i.id), ["a", "c", "b", "d"]);
  for (const item of candidate.items) assert.equal(item, original.items.find(i => i.id === item.id));
  assert.deepEqual(original.items.map(i => i.id), ["a", "b", "c", "d"]);
});
test("fixed times, activities, notes, observations and sections split reorderable runs", () => {
  for (const extra of [{ time: "09:00" }, { schedule: [{ label: "Reservation" }] }, { notes: "Reservation" }, { observedSocCheckpoint: { socPct: 80 } }, { type: "section" }]) {
    const original = day([place("a"), place("b"), { ...place("locked"), ...extra }, place("c"), place("d")]);
    assert.equal(dayOrderCandidates(original, true).length, 0);
  }
});
test("keep mode pins chargers; flexible mode permits movement but never unlocks locked stations", () => {
  const charger = { ...place("ev"), evCharger: { targetBatteryPct: 65 } };
  assert.equal(movable(charger, false), false);
  assert.equal(movable(charger, true), true);
  assert.equal(movable({ ...charger, evCharger: { ...charger.evCharger, locked: true } }, true), false);
});
test("strategies score distance, time and repeated roads independently", () => {
  const metrics = { distanceMeters: 10000, seconds: 600, repeatedMeters: 2000 };
  assert.equal(routeScore(metrics, "distance"), 10000);
  assert.equal(routeScore(metrics, "time"), 600);
  assert.equal(routeScore(metrics, "backtracking"), 16000);
  assert.equal(meaningfulImprovement(metrics, { ...metrics, seconds: 590 }, "time"), false);
  assert.equal(meaningfulImprovement(metrics, { ...metrics, seconds: 500 }, "time"), true);
});
test("unknown and fallback roads cannot certify a route improvement", () => {
  assert.equal(routeMetrics([]), null);
  assert.equal(routeMetrics([{ status: "fallback", distanceMeters: 100, durationSeconds: 10 }]), null);
});
