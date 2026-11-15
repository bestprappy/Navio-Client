import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { dayHasNoAutoAddSlot, requiredArrivalPct, lowestStopArrivalPct } = await import("../../app/feature/planner/planId/_components/charger/day-charging-need.ts");

const threshold = 87;
const state = arrival => ({ rawPredictedArrivalSocPct: arrival, distanceQuality: "ROUTED" });
const day = arrivals => ({ batteryByItemId: new Map(arrivals.map(([id, pct]) => [id, state(pct)])) });
const block = chargerIds => ({ items: ["start", "charger", "museum", "end"].map(id => ({
  id, type: "place", ...(chargerIds.includes(id) ? { evCharger: {} } : {}) })) });

test("the threshold triggers charging: chargers may be reached down to 10%, itinerary stops may not drop below it", () => {
  assert.equal(requiredArrivalPct(threshold, false), 87);
  assert.equal(requiredArrivalPct(threshold, true), 10);
  assert.equal(requiredArrivalPct(6, true), 6);
});

test("a day starting below the threshold still has an Auto Add slot until its stops are covered", () => {
  // Start 80%, threshold 87%: the museum arrives at 70%, so a charger is needed.
  assert.equal(dayHasNoAutoAddSlot(day([["start", 80], ["museum", 70], ["end", 90]]), block([]), threshold), false);
  // With a charger before it, reached at 76% and leaving at 100%, the museum arrives at 95% and the end at 88%.
  assert.equal(dayHasNoAutoAddSlot(day([["start", 80], ["charger", 76], ["museum", 95], ["end", 88]]), block(["charger"]), threshold), true);
});

test("the final stop needs the threshold too and unknown legs never count as covered", () => {
  assert.equal(dayHasNoAutoAddSlot(day([["start", 95], ["museum", 90], ["end", 88]]), block([]), threshold), true);
  assert.equal(dayHasNoAutoAddSlot(day([["start", 95], ["museum", 90], ["end", 60]]), block([]), threshold), false);
  const unrouted = day([["start", 95], ["museum", 90], ["end", 90]]);
  unrouted.batteryByItemId.get("museum").distanceQuality = "FALLBACK";
  assert.equal(dayHasNoAutoAddSlot(unrouted, block([]), threshold), false);
});

test("the lowest stop arrival ignores chargers and the starting point", () => {
  assert.equal(lowestStopArrivalPct(day([["start", 5], ["charger", 12], ["museum", 40], ["end", 33]]), block(["charger"])), 33);
  assert.equal(lowestStopArrivalPct(null, block([])), null);
});
