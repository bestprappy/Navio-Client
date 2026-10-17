import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { createStore } = await import("jotai");
const schedule = await import("../../app/feature/planner/planId/_components/itinerary/stop-schedule.ts");
const { applyDayTimesAtom, undoDayTimesAtom } = await import("../../app/feature/planner/planId/_components/itinerary/day-timing.atoms.ts");
const { tripBlocksAtom, updatePlaceItemAtom } = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { savePlannerSnapshot, getPlannerSnapshot } = await import("../../app/feature/planner/_components/planner-api.ts");

const moment = (id, time, label, timeEnd) => (timeEnd ? { id, time, timeEnd, label } : { id, time, label });
const checkIn = moment("in", "09:00", "Check in", "09:10");
const shower = moment("shower", "09:30", "Shower");
const leave = moment("leave", "10:10", "Prepare to leave", "10:20");
const hotel = { id: "hotel", type: "place", placeId: "GOOGLE:hotel", name: "Hotel", address: "Taipei", lat: 25.04, lng: 121.5, time: "09:00", timeEnd: "10:20", timeSource: "fixed", schedule: [checkIn, shower, leave] };

function storeWith(items) {
  const store = createStore();
  store.set(tripBlocksAtom, [{ id: "day", kind: "itinerary", title: "Day 1", date: "2026-10-14", colorId: "teal", items }]);
  return store;
}
const stop = (store, id = "hotel") => store.get(tripBlocksAtom)[0].items.find((item) => item.id === id);

test("reads times the way travellers type them", () => {
  assert.equal(schedule.parseClockInput("9"), "09:00");
  assert.equal(schedule.parseClockInput("930"), "09:30");
  assert.equal(schedule.parseClockInput("9.30"), "09:30");
  assert.equal(schedule.parseClockInput("9:30 pm"), "21:30");
  assert.equal(schedule.parseClockInput("12 am"), "00:00");
  assert.equal(schedule.parseClockInput("21:45"), "21:45");
  assert.equal(schedule.parseClockInput("25:00"), null);
  assert.equal(schedule.parseClockInput("9:75"), null);
  assert.equal(schedule.parseClockInput("soon"), null);
});

test("takes the time from a line that starts with one, as people already write in notes", () => {
  assert.deepEqual(schedule.splitLeadingTime("7:30 AM เอากระเป๋า"), { time: "07:30", label: "เอากระเป๋า" });
  assert.deepEqual(schedule.splitLeadingTime("9:00-9:10 Check in"), { time: "09:00", timeEnd: "09:10", label: "Check in" });
  assert.deepEqual(schedule.splitLeadingTime("2pm Coffee"), { time: "14:00", label: "Coffee" });
});

test("does not mistake a plain number at the start of a line for a time", () => {
  assert.equal(schedule.splitLeadingTime("10 people at dinner"), null);
  assert.equal(schedule.splitLeadingTime("Check in"), null);
  assert.equal(schedule.splitLeadingTime("9:00-99:99 Broken"), null);
});

test("orders moments by time and keeps the written order for moments at the same time", () => {
  const sameTime = moment("towel", "09:30", "Towels");
  assert.deepEqual(schedule.sortSchedule([leave, shower, checkIn, sameTime]).map((entry) => entry.id), ["in", "shower", "towel", "leave"]);
});

test("moves every moment with the stop's start, wrapping past midnight", () => {
  const shifted = schedule.shiftSchedule([checkIn, leave], "09:00", "23:30");
  assert.deepEqual(shifted.map((entry) => [entry.time, entry.timeEnd]), [["23:30", "23:40"], ["00:40", "00:50"]]);
  assert.equal(schedule.shiftSchedule([checkIn], undefined, "10:00")[0], checkIn);
  assert.equal(schedule.shiftSchedule([checkIn], "09:00", undefined)[0], checkIn);
});

test("suggests the next moment where the last one ends, a little after it, or when the stop starts", () => {
  assert.equal(schedule.suggestNextTime({ time: "09:00", schedule: [checkIn, leave] }), "10:20");
  assert.equal(schedule.suggestNextTime({ time: "09:00", schedule: [shower] }), "09:40");
  assert.equal(schedule.suggestNextTime({ time: "13:15", schedule: [] }), "13:15");
  assert.equal(schedule.suggestNextTime({}), "09:00");
});

test("flags a moment that starts or ends outside the stop's time", () => {
  assert.equal(schedule.isOutsideStop(checkIn, hotel), false);
  assert.equal(schedule.isOutsideStop(moment("early", "08:50", "Queue"), hotel), true);
  assert.equal(schedule.isOutsideStop(moment("late", "10:15", "Taxi", "10:40"), hotel), true);
  assert.equal(schedule.isOutsideStop(moment("any", "03:00", "Anything"), { time: undefined }), false);
  // A stop running past midnight wraps.
  assert.equal(schedule.isOutsideStop(moment("night", "00:30", "Last train"), { time: "23:00", timeEnd: "01:00" }), false);
});

test("points out free time only when the gap is worth mentioning", () => {
  assert.equal(schedule.freeMinutesBefore([checkIn, shower, leave], 1), 20);
  assert.equal(schedule.freeMinutesBefore([checkIn, shower, leave], 2), 40);
  assert.equal(schedule.freeMinutesBefore([checkIn, moment("x", "09:15", "Bags")], 1), null);
  assert.equal(schedule.freeMinutesBefore([checkIn], 0), null);
  assert.equal(schedule.formatDuration(80), "1 h 20 min");
});

test("changing the stop's start time carries its schedule along", () => {
  const store = storeWith([hotel]);
  store.set(updatePlaceItemAtom, { blockId: "day", itemId: "hotel", updates: { time: "10:00", timeEnd: "11:20", timeSource: "fixed" } });
  assert.deepEqual(stop(store).schedule.map((entry) => entry.time), ["10:00", "10:30", "11:10"]);
  assert.equal(stop(store).timeEnd, "11:20");
});

test("editing other fields or setting the schedule itself never shifts the moments", () => {
  const store = storeWith([hotel]);
  store.set(updatePlaceItemAtom, { blockId: "day", itemId: "hotel", updates: { notes: "Late checkout" } });
  assert.equal(stop(store).schedule, hotel.schedule);
  store.set(updatePlaceItemAtom, { blockId: "day", itemId: "hotel", updates: { time: "11:00", schedule: [shower] } });
  assert.deepEqual(stop(store).schedule, [shower]);
});

test("calculated times move a stop's schedule and undo moves it back", () => {
  // Calculated at 7:00 with a moment at 7:00; a fresh calculation starts the day later.
  const calculated = { ...hotel, time: "07:00", timeEnd: "08:20", timeSource: "calculated", schedule: [moment("in", "07:00", "Check in")] };
  const store = storeWith([calculated]);
  const result = store.set(applyDayTimesAtom, { blockId: "day", mode: "keep-fixed", travelMinutesByItemId: new Map(), startsFromAnchor: false });
  assert.equal(result.status, "applied");
  const moved = stop(store);
  assert.notEqual(moved.time, "07:00");
  assert.equal(moved.schedule[0].time, moved.time);
  store.set(undoDayTimesAtom, result.undo);
  assert.deepEqual(stop(store).schedule, calculated.schedule);
});

test("schedules round-trip with a trip service that stores them", async () => {
  const originalFetch = globalThis.fetch;
  const blocks = [{ id: "day", kind: "itinerary", title: "Day 1", date: "2026-10-14", colorId: "teal", items: [hotel] }];
  const budget = { currency: "THB", amount: 0, expenses: [] };
  let stored = { blocks: [], budget, version: 1, savedAt: "2026-10-14T00:00:00Z", capabilities: ["time-source-v1", "item-schedule-v1"] };
  globalThis.fetch = async (_url, request) => {
    if (request?.method === "PUT") {
      stored = { ...stored, ...JSON.parse(request.body), version: 2 };
      return Response.json({ version: 2, savedAt: stored.savedAt });
    }
    return Response.json(stored);
  };
  try {
    const saved = await savePlannerSnapshot("trip", blocks, budget, 1);
    assert.equal(saved.localOnlySettings, false);
    assert.deepEqual((await getPlannerSnapshot("trip")).blocks[0].items[0].schedule, hotel.schedule);
  } finally { globalThis.fetch = originalFetch; }
});

test("an older trip service gets no schedule and the draft keeps it", async () => {
  const originalFetch = globalThis.fetch;
  const blocks = [{ id: "day", kind: "itinerary", title: "Day 1", date: "2026-10-14", colorId: "teal", items: [hotel] }];
  const budget = { currency: "THB", amount: 0, expenses: [] };
  let sent;
  globalThis.fetch = async (_url, request) => {
    if (request?.method === "PUT") {
      sent = JSON.parse(request.body);
      return Response.json({ version: 2, savedAt: "2026-10-14T00:00:00Z" });
    }
    return Response.json({ blocks: [], budget, version: 1, savedAt: "2026-10-14T00:00:00Z", capabilities: ["time-source-v1"] });
  };
  try {
    const saved = await savePlannerSnapshot("trip", blocks, budget, 1);
    assert.equal(saved.localOnlySettings, true);
    assert.equal(sent.blocks[0].items[0].schedule, undefined);
    assert.deepEqual(blocks[0].items[0].schedule, hotel.schedule);
  } finally { globalThis.fetch = originalFetch; }
});

test("a malformed moment from the server is rejected rather than shown", () => {
  assert.equal(schedule.isScheduleEntry(checkIn), true);
  assert.equal(schedule.isScheduleEntry({ id: "x", time: "9:00", label: "Loose" }), false);
  assert.equal(schedule.isScheduleEntry({ id: "", time: "09:00", label: "No id" }), false);
  assert.equal(schedule.isScheduleEntry({ id: "x", time: "09:00" }), false);
});
