import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { dayHasNoAutoAddSlot, requiredArrivalPct } = await import("../../app/feature/planner/planId/_components/charger/day-charging-need.ts");

const prefs = { batteryThresholdPct: 87, minimumArrivalPct: 10 };
const state = arrival => ({ rawPredictedArrivalSocPct: arrival, distanceQuality: "ROUTED" });
const day = arrivals => ({ batteryByItemId: new Map(arrivals.map(([id, pct]) => [id, state(pct)])) });
const block = chargerIds => ({ items: ["start", "charger", "museum", "end"].map(id => ({
  id, type: "place", ...(chargerIds.includes(id) ? { evCharger: {} } : {}) })) });

test("the threshold triggers charging: chargers may be reached below it, itinerary stops may not", () => {
  assert.equal(requiredArrivalPct(prefs, false, false), 87);
  assert.equal(requiredArrivalPct(prefs, true, false), 10);
  assert.equal(requiredArrivalPct(prefs, false, true), 10);
});

test("a day starting below the threshold still has an Auto Add slot until its stops are covered", () => {
  // Start 80%, threshold 87%: the screenshot case. The museum arrives at 70%, so a charger is needed.
  assert.equal(dayHasNoAutoAddSlot(day([["start", 80], ["museum", 70], ["end", 55]]), block([]), prefs), false);
  // With a charger before it, reached at 76% and leaving at 100%, the museum arrives at 95%.
  assert.equal(dayHasNoAutoAddSlot(day([["start", 80], ["charger", 76], ["museum", 95], ["end", 55]]), block(["charger"]), prefs), true);
});

test("the final stop only needs the minimum arrival battery and unknown legs never count as covered", () => {
  assert.equal(dayHasNoAutoAddSlot(day([["start", 95], ["museum", 90], ["end", 12]]), block([]), prefs), true);
  assert.equal(dayHasNoAutoAddSlot(day([["start", 95], ["museum", 90], ["end", 8]]), block([]), prefs), false);
  const unrouted = day([["start", 95], ["museum", 90], ["end", 50]]);
  unrouted.batteryByItemId.get("museum").distanceQuality = "FALLBACK";
  assert.equal(dayHasNoAutoAddSlot(unrouted, block([]), prefs), false);
});
