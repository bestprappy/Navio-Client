import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { createStore } = await import("jotai");
const { calculateDaySchedule, describeTimingIssue, isDayScheduleStale } = await import("../../app/feature/planner/planId/_components/itinerary/day-timing.ts");
const { applyDayTimesAtom, canUndoDayTimes, fillNewStopTimesAtom, undoDayTimesAtom } = await import("../../app/feature/planner/planId/_components/itinerary/day-timing.atoms.ts");
const { getTravelMinutesByItemId } = await import("../../app/feature/planner/planId/_components/itinerary/use-day-schedule.ts");
const { addPlaceVisitToBlockAtom, tripBlocksAtom } = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");

const place = (id, times = {}) => ({ id, type: "place", placeId: `GOOGLE:${id}`, name: id, address: "", lat: 13.75, lng: 100.5, ...times });
const charger = (id, minutes) => ({ ...place(id), placeId: `ev-charger:${id}`, evCharger: { connectorTypes: ["CCS2"], maxKw: 50, totalConnectors: 2, availableConnectors: null, priceText: null, openingHoursSummary: null, estimatedChargeMinutes: minutes, operatorName: null } });
const travel = (entries) => new Map(Object.entries(entries));
const day = (stops, legs, startsFromAnchor = false) => ({ stops, travelMinutesByItemId: travel(legs), startsFromAnchor });

// The user's example: A fixed -> B calculated -> C fixed -> D calculated.
const a = place("A", { time: "09:00", timeEnd: "10:00", timeSource: "fixed" });
const b = place("B");
const c = place("C", { time: "12:00", timeEnd: "13:00", timeSource: "fixed" });
const d = place("D");
const legs = { B: 15, C: 15, D: 15 };

test("calculates the stops between fixed times and leaves the fixed times alone", () => {
  const schedule = calculateDaySchedule(day([a, b, c, d], legs));
  assert.deepEqual(Object.fromEntries(schedule.updates), {
    B: { time: "10:15", timeEnd: "11:15" },
    D: { time: "13:15", timeEnd: "14:15" },
  });
  assert.deepEqual(schedule.issues, []);
});

test("keeps both fixed times and reports the shortfall when a stop cannot fit between them", () => {
  const tightC = { ...c, time: "11:05", timeEnd: "12:00" };
  const schedule = calculateDaySchedule(day([a, b, tightC, d], legs));
  assert.equal(schedule.updates.has("C"), false);
  assert.deepEqual(schedule.updates.get("B"), { time: "10:15", timeEnd: "11:15" });
  assert.deepEqual(schedule.issues, [{ kind: "late", itemId: "C", name: "C", minutes: 25 }]);
  assert.equal(describeTimingIssue(schedule.issues[0]), "You need 25 more minutes to reach C on time.");
  // D still continues from C's fixed end.
  assert.deepEqual(schedule.updates.get("D"), { time: "12:15", timeEnd: "13:15" });
});

test("treats a time with no source as typed by the traveller", () => {
  const legacy = { ...a, timeSource: undefined };
  const schedule = calculateDaySchedule(day([legacy, b], { B: 10 }));
  assert.equal(schedule.updates.has("A"), false);
  assert.deepEqual(schedule.updates.get("B"), { time: "10:10", timeEnd: "11:10" });
});

test("does not count missing travel as zero and resumes at the next fixed time", () => {
  const schedule = calculateDaySchedule(day([a, b, c, d], { C: 15, D: 15 }));
  assert.equal(schedule.updates.has("B"), false);
  assert.deepEqual(schedule.issues, [{ kind: "missing-travel", itemId: "B", name: "B" }]);
  assert.deepEqual(schedule.updates.get("D"), { time: "13:15", timeEnd: "14:15" });
});

test("keeps a calculated stop's visit length when it moves", () => {
  const long = place("B", { time: "10:00", timeEnd: "12:30", timeSource: "calculated" });
  const schedule = calculateDaySchedule(day([a, long], { B: 20 }));
  assert.deepEqual(schedule.updates.get("B"), { time: "10:20", timeEnd: "12:50" });
});

test("starts the day earlier when an early fixed stop needs it, but never later than 9 AM", () => {
  const early = place("E", { time: "08:00", timeSource: "fixed" });
  const schedule = calculateDaySchedule(day([place("X"), early], { E: 30 }));
  assert.deepEqual(schedule.updates.get("X"), { time: "06:30", timeEnd: "07:30" });
  assert.deepEqual(schedule.issues, []);
  const late = place("L", { time: "15:00", timeSource: "fixed" });
  assert.deepEqual(calculateDaySchedule(day([place("X"), late], { L: 30 })).updates.get("X"), { time: "09:00", timeEnd: "10:00" });
});

test("leaves the start anchor at 9 AM and arrives after the first leg", () => {
  const schedule = calculateDaySchedule(day([b], { B: 25 }, true));
  assert.deepEqual(schedule.updates.get("B"), { time: "09:25", timeEnd: "10:25" });
});

test("passes through a charger for its charging time without giving it a time", () => {
  const schedule = calculateDaySchedule(day([a, charger("EV", 40), b], { EV: 10, B: 10 }));
  assert.equal(schedule.updates.has("EV"), false);
  assert.deepEqual(schedule.updates.get("B"), { time: "11:00", timeEnd: "12:00" });
  const unknown = calculateDaySchedule(day([a, charger("EV", null), b], { EV: 10, B: 10 }));
  assert.deepEqual(unknown.issues, [{ kind: "missing-duration", itemId: "EV", name: "EV" }]);
  assert.equal(unknown.updates.has("B"), false);
});

test("refuses to run a stop past midnight", () => {
  const evening = place("A", { time: "23:00", timeEnd: "23:30", timeSource: "fixed" });
  const schedule = calculateDaySchedule(day([evening, b], { B: 15 }));
  assert.equal(schedule.updates.has("B"), false);
  assert.equal(schedule.issues[0].kind, "past-midnight");
});

test("recalculating all times keeps the day's start and lists every fixed time it replaces", () => {
  const schedule = calculateDaySchedule(day([a, b, c, d], legs), "replace-all");
  assert.deepEqual(schedule.updates.get("A"), { time: "09:00", timeEnd: "10:00" });
  assert.deepEqual(schedule.updates.get("C"), { time: "11:30", timeEnd: "12:30" });
  assert.deepEqual(schedule.replaced.map(entry => [entry.itemId, entry.from.time, entry.to.time]), [["C", "12:00", "11:30"]]);
  assert.deepEqual(calculateDaySchedule(day([a, b, c, d], legs)).replaced, []);
});

test("flags a calculated day whose route changed, but never a day that was not calculated", () => {
  const calculatedB = { ...b, time: "10:15", timeEnd: "11:15", timeSource: "calculated" };
  assert.equal(isDayScheduleStale([a, calculatedB], calculateDaySchedule(day([a, calculatedB], { B: 15 }))), false);
  assert.equal(isDayScheduleStale([a, calculatedB], calculateDaySchedule(day([a, calculatedB], { B: 40 }))), true);
  assert.equal(isDayScheduleStale([a, b], calculateDaySchedule(day([a, b], { B: 15 }))), false);
});

test("uses only routed legs as travel times", () => {
  const map = getTravelMinutesByItemId([
    { blockId: "day", toItemId: "B", status: "routed", durationSeconds: 900 },
    { blockId: "day", toItemId: "C", status: "fallback", durationSeconds: 600 },
    { blockId: "other", toItemId: "D", status: "routed", durationSeconds: 60 },
  ], "day");
  assert.deepEqual(Object.fromEntries(map), { B: 15, C: null });
});

function storeWith(items) {
  const store = createStore();
  store.set(tripBlocksAtom, [{ id: "day", kind: "itinerary", title: "Day 1", date: "2026-10-14", colorId: "teal", items: [{ id: "note", type: "note", content: "Bring water" }, ...items] }]);
  return store;
}
const dayItems = (store) => store.get(tripBlocksAtom)[0].items.filter(item => item.type === "place");
const payload = { blockId: "day", mode: "keep-fixed", travelMinutesByItemId: travel(legs), startsFromAnchor: false };

test("applying marks new times as calculated and undo restores them", () => {
  const store = storeWith([a, b, c, d]);
  const result = store.set(applyDayTimesAtom, payload);
  assert.equal(result.status, "applied");
  const [, nextB, nextC] = dayItems(store);
  assert.deepEqual([nextB.time, nextB.timeEnd, nextB.timeSource], ["10:15", "11:15", "calculated"]);
  assert.equal(nextC, c);
  assert.equal(store.get(tripBlocksAtom)[0].items[0].type, "note");
  assert.equal(store.set(applyDayTimesAtom, payload).status, "unchanged");

  assert.equal(store.set(undoDayTimesAtom, result.undo), true);
  // Restored absent fields are undefined, which saves exactly like the original.
  assert.deepEqual(JSON.parse(JSON.stringify(dayItems(store))), [a, b, c, d]);
});

test("undo keeps a time the traveller edited after calculating", () => {
  const store = storeWith([a, b, c, d]);
  const { undo } = store.set(applyDayTimesAtom, payload);
  store.set(tripBlocksAtom, store.get(tripBlocksAtom).map(block => ({ ...block, items: block.items.map(item => item.id === "B" ? { ...item, time: "10:45", timeSource: "fixed" } : item) })));
  assert.equal(canUndoDayTimes(dayItems(store), undo), true);
  store.set(undoDayTimesAtom, undo);
  const [, keptB, , restoredD] = dayItems(store);
  assert.deepEqual([keptB.time, keptB.timeSource], ["10:45", "fixed"]);
  assert.equal(restoredD.time, undefined);
});

test("replacing fixed times only goes ahead with the list the traveller confirmed", () => {
  const store = storeWith([a, b, c, d]);
  const stale = store.set(applyDayTimesAtom, { ...payload, mode: "replace-all", confirmedReplaced: [] });
  assert.equal(stale.status, "preview-changed");
  assert.equal(dayItems(store)[2], c);
  const result = store.set(applyDayTimesAtom, { ...payload, mode: "replace-all", confirmedReplaced: stale.replaced });
  assert.equal(result.status, "applied");
  assert.deepEqual([dayItems(store)[2].time, dayItems(store)[2].timeSource], ["11:30", "calculated"]);
});

test("a card added to an empty day gets a suggested 9 AM time right away", () => {
  const store = storeWith([]);
  const id = store.set(addPlaceVisitToBlockAtom, { blockId: "day", place: { placeId: "GOOGLE:museum", name: "Museum", address: "", lat: 13.7, lng: 100.5 } });
  const added = dayItems(store)[0];
  assert.deepEqual([added.id, added.time, added.timeSource], [id, undefined, "calculated"]);
  assert.equal(store.set(fillNewStopTimesAtom, { blockId: "day", travelMinutesByItemId: travel({}), startsFromAnchor: false }), true);
  assert.deepEqual([dayItems(store)[0].time, dayItems(store)[0].timeEnd, dayItems(store)[0].timeSource], ["09:00", "10:00", "calculated"]);
});

test("a new card waits for its travel time and never changes other cards", () => {
  const store = storeWith([a, b]);
  store.set(addPlaceVisitToBlockAtom, { blockId: "day", place: { placeId: "GOOGLE:museum", name: "Museum", address: "", lat: 13.7, lng: 100.5 } });
  const added = dayItems(store)[2];
  assert.equal(store.set(fillNewStopTimesAtom, { blockId: "day", travelMinutesByItemId: travel({ B: 15 }), startsFromAnchor: false }), false);
  assert.equal(dayItems(store)[2].time, undefined);
  store.set(fillNewStopTimesAtom, { blockId: "day", travelMinutesByItemId: travel({ B: 15, [added.id]: 20 }), startsFromAnchor: false });
  const [keptA, untouchedB, filled] = dayItems(store);
  assert.equal(keptA, a);
  assert.equal(untouchedB, b);
  // B has no time but still takes its place in the day: 10:15-11:15, then 20 minutes' travel.
  assert.deepEqual([filled.time, filled.timeEnd], ["11:35", "12:35"]);
});