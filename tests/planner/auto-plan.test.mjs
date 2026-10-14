import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, next) {
  if (!context.parentURL?.includes("node_modules") && specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier)) return next(`${specifier}.ts`, context);
  return next(specifier, context);
} });
const modulePath = "../../app/feature/planner/planId/_components/auto-plan/";
const { buildDayAutoPlan, arrangeDayItems, estimateTravel, defaultAutoPlanMode } = await import(`${modulePath}day-auto-plan.ts`);
const { getOpeningWindows, fitVisit } = await import(`${modulePath}opening-hours.ts`);
const { applyDayAutoPlanAtom, undoDayAutoPlanAtom, autoPlanUndoAtom, refineAutoPlanTimesAtom, canUndoAutoPlan } = await import(`${modulePath}auto-plan.atoms.ts`);
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { createStore } = await import("jotai");
const dayTiming = await import("../../app/feature/planner/planId/_components/itinerary/day-timing.ts");

// 2026-10-14 is a Wednesday.
const DATE = "2026-10-14";
const BASE = { lat: 35.68, lng: 139.76 };
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hours = (value, overrides = {}) => WEEK.map((day) => `${day}: ${overrides[day] ?? value}`);
const at = (north, east = 0) => ({ lat: BASE.lat + north * 0.009, lng: BASE.lng + east * 0.011 });

function stop(id, position, extra = {}) {
  return { id, type: "place", placeId: `GOOGLE:${id}`, name: id, address: "", ...position, ...extra };
}
function detail(id, primaryType = "tourist_attraction", weekly = hours("9:00 AM – 9:00 PM")) {
  return { id: `GOOGLE:${id}`, provider: "GOOGLE", providerPlaceId: id, name: id, address: "", ...BASE, primaryType, weekdayOpeningHours: weekly };
}
const settings = (extra = {}) => ({ startMinute: 9 * 60, endMinute: 21 * 60, mode: "drive", keepSetTimes: true, ...extra });
function plan(items, details, extra = {}) {
  return buildDayAutoPlan({ items, date: DATE, details: new Map(details.map((value) => [value.id.replace("GOOGLE:", ""), value])), start: null, end: null, settings: settings(extra.settings), ...extra.input });
}
const order = (result) => result.stops.map((value) => value.itemId);

test("opening hours follow the travel date, tell closed from unknown and keep split windows", () => {
  assert.deepEqual(getOpeningWindows({ weekdayOpeningHours: hours("9:00 AM – 6:00 PM", { Wednesday: "Closed" }) }, DATE), []);
  assert.equal(getOpeningWindows({ openingHours: "9 AM – 6 PM" }, DATE), null);
  assert.deepEqual(getOpeningWindows({ weekdayOpeningHours: hours("9:00 AM – 12:00 PM, 2:00 PM – 6:00 PM") }, DATE), [[540, 720], [840, 1080]]);
  assert.deepEqual(getOpeningWindows({ weekdayOpeningHours: hours("Closed", { Tuesday: "6:00 PM – 2:00 AM" }) }, DATE), [[0, 120]]);
  assert.equal(getOpeningWindows({ weekdayOpeningHours: hours("9 AM – 6 PM") }, "2026-02-30"), null);
  assert.equal(fitVisit([[540, 720], [840, 1080]], 700, 60, 1440), 840);
});

test("visits nearby places together instead of zig-zagging across town", () => {
  const items = [stop("a1", at(0)), stop("b1", at(8)), stop("a2", at(0.4)), stop("b2", at(8.4))];
  const result = plan(items, items.map((item) => detail(item.id)));
  const ids = order(result);
  assert.equal(Math.abs(ids.indexOf("a1") - ids.indexOf("a2")), 1);
  assert.equal(Math.abs(ids.indexOf("b1") - ids.indexOf("b2")), 1);
  assert.ok(result.travelMinutes < result.currentTravelMinutes);
  assert.equal(result.unplanned.length, 0);
});

test("puts one restaurant at lunch and a second at dinner, pinned so recalculating keeps them", () => {
  const items = [stop("ramen", at(0)), stop("sushi", at(0.2)), stop("museum", at(0.4)), stop("park", at(0.6)), stop("temple", at(0.8))];
  const details = [detail("ramen", "ramen_restaurant"), detail("sushi", "sushi_restaurant"), detail("museum", "museum"), detail("park", "park"), detail("temple", "buddhist_temple")];
  const result = plan(items, details);
  const meals = result.stops.filter((value) => value.meal);
  assert.deepEqual(meals.map((value) => value.meal).toSorted(), ["dinner", "lunch"]);
  const lunch = meals.find((value) => value.meal === "lunch");
  const dinner = meals.find((value) => value.meal === "dinner");
  assert.ok(lunch.start >= 11 * 60 + 30 && lunch.start <= 14 * 60);
  assert.ok(dinner.start >= 17 * 60 + 30 && dinner.start <= 20 * 60 + 30);
  assert.ok(meals.every((value) => value.pin === "meal"));
  assert.ok(order(result).indexOf(lunch.itemId) < order(result).indexOf(dinner.itemId));
});

test("fills the morning with sights instead of waiting for lunch", () => {
  const items = [stop("ramen", at(0)), stop("shrine", at(3)), stop("tower", at(6))];
  const result = plan(items, [detail("ramen", "ramen_restaurant", hours("10:00 AM – 10:00 PM")), detail("shrine", "shinto_shrine"), detail("tower")]);
  assert.notEqual(result.stops[0].itemId, "ramen");
  assert.equal(result.stops[0].start, 9 * 60);
});

test("starts at the chosen time when another order would only move idle time to the morning", () => {
  const items = [stop("late", at(0)), stop("early", at(0.3)), stop("dinner", at(0.6))];
  const result = plan(items, [detail("late", "tourist_attraction", hours("10:00 AM – 9:00 PM")), detail("early", "buddhist_temple", hours("6:00 AM – 5:00 PM")), detail("dinner", "sushi_restaurant", hours("5:00 PM – 10:00 PM"))]);
  assert.deepEqual(order(result), ["early", "late", "dinner"]);
  assert.equal(result.stops[0].start, 9 * 60);
});

test("starts every visit inside its opening hours and waits for a late opening", () => {
  const items = [stop("early", at(0)), stop("late", at(0.3))];
  const details = [detail("early", "museum", hours("8:00 AM – 12:00 PM")), detail("late", "museum", hours("1:00 PM – 5:00 PM"))];
  const result = plan(items, details);
  assert.deepEqual(order(result), ["early", "late"]);
  const late = result.stops[1];
  assert.ok(late.start >= 13 * 60 && late.end <= 17 * 60);
  assert.equal(late.pin, "opening");
  assert.ok(late.waitMinutes > 0);
});

test("explains places that cannot fit instead of squeezing them in", () => {
  const items = [stop("open", at(0)), stop("closed", at(0.2)), stop("night", at(0.3)), stop("other", at(0.4))];
  const details = [
    detail("open"),
    detail("closed", "museum", hours("9:00 AM – 5:00 PM", { Wednesday: "Closed" })),
    detail("night", "night_club", hours("11:00 PM – 4:00 AM")),
    detail("other"),
  ];
  const result = plan(items, details);
  assert.deepEqual(Object.fromEntries(result.unplanned.map((value) => [value.itemId, value.reason])), { closed: "closed", night: "hours" });
});

test("keeps a time the traveller set and never makes them late for it", () => {
  const items = [
    stop("booked", at(0), { time: "10:00", timeEnd: "11:00", timeSource: "fixed" }),
    stop("far", at(20)), stop("near", at(0.2)),
  ];
  const result = plan(items, items.map((item) => detail(item.id, "museum")), { settings: { startMinute: 9 * 60 + 30 } });
  const booked = result.stops.find((value) => value.itemId === "booked");
  assert.equal(booked.start, 600);
  assert.equal(booked.pin, "yours");
  assert.ok(result.stops.every((value) => value.lateMinutes === 0));
  const moved = plan(items, items.map((item) => detail(item.id, "museum")), { settings: { keepSetTimes: false, startMinute: 9 * 60 + 30 } });
  assert.notEqual(moved.stops.find((value) => value.itemId === "booked").pin, "yours");
});

test("an unknown closing time is planned but kept visible as unknown", () => {
  const items = [stop("a", at(0)), stop("b", at(0.2))];
  const result = plan(items, [detail("a"), { ...detail("b"), weekdayOpeningHours: undefined }]);
  assert.equal(result.stops.find((value) => value.itemId === "b").hours, null);
  assert.equal(result.unplanned.length, 0);
});

test("notes, stations and hotels keep their relationship to the places around them", () => {
  const note = { id: "note-a", type: "note", content: "Buy tickets" };
  const items = [
    { id: "top", type: "note", content: "Day notes" },
    stop("hotel", at(0)),
    stop("a", at(5)), note, stop("station", at(5.1)),
    stop("b", at(0.2)),
  ];
  const details = [detail("hotel", "hotel"), detail("a"), detail("station", "subway_station"), detail("b")];
  const result = plan(items, details);
  assert.equal(result.followCount, 1);
  assert.deepEqual(result.lastIds, ["hotel"]);
  const { items: arranged } = arrangeDayItems(items, result, true);
  const ids = arranged.map((item) => item.id);
  assert.equal(ids[0], "top");
  assert.equal(ids.at(-1), "hotel");
  assert.deepEqual(ids.slice(ids.indexOf("a"), ids.indexOf("a") + 3), ["a", "note-a", "station"]);
});

test("places that do not fit lose their time and can move to another day", () => {
  const items = [stop("open", at(0)), stop("closed", at(0.2), { time: "12:00", timeEnd: "13:00", timeSource: "calculated" }), stop("other", at(0.3))];
  const details = [detail("open"), detail("closed", "museum", hours("Closed")), detail("other")];
  const result = plan(items, details);
  const kept = arrangeDayItems(items, result, true);
  assert.equal(kept.items.at(-1).id, "closed");
  assert.equal(kept.items.at(-1).time, undefined);
  const moved = arrangeDayItems(items, result, false);
  assert.deepEqual(moved.moved.map((item) => item.id), ["closed"]);
  assert.ok(!moved.items.some((item) => item.id === "closed"));
});

test("travel estimates walk short hops and pick the day's usual mode", () => {
  assert.ok(estimateTravel(at(0), at(0.1), "drive").minutes < 5);
  assert.ok(estimateTravel(at(0), at(10), "walk").minutes > estimateTravel(at(0), at(10), "drive").minutes);
  assert.equal(defaultAutoPlanMode([stop("a", at(0), { arrivalMode: "rail" }), stop("b", at(1), { arrivalMode: "transit" }), stop("c", at(2))]), "transit");
  assert.equal(defaultAutoPlanMode([]), "drive");
});

test("Calculate times and Auto plan give a place the same typical visit length", () => {
  const { calculateDaySchedule } = dayTiming;
  const museum = stop("museum", at(0), { placeType: "museum" });
  const { updates } = calculateDaySchedule({ stops: [museum], travelMinutesByItemId: new Map(), startsFromAnchor: false });
  assert.deepEqual(updates.get("museum"), { time: "09:00", timeEnd: "11:00" });
  const planned = plan([museum, stop("park", at(0.2), { placeType: "park" })], [detail("museum", "museum"), detail("park", "park")]);
  assert.equal(planned.stops.find((value) => value.itemId === "museum").end - planned.stops.find((value) => value.itemId === "museum").start, 120);
  // A stop without a known type keeps the usual hour.
  assert.equal(calculateDaySchedule({ stops: [stop("x", at(0))], travelMinutesByItemId: new Map(), startsFromAnchor: false }).updates.get("x").timeEnd, "10:00");
});

function storeWithDay(items) {
  const store = createStore();
  const blocks = [
    { id: "day-1", kind: "itinerary", title: "", date: DATE, colorId: "teal", items },
    { id: "day-2", kind: "itinerary", title: "", date: "2026-10-15", colorId: "blue", items: [] },
  ];
  store.set(atoms.tripBlocksAtom, blocks);
  return store;
}

test("applying orders the day in one change and Undo restores every affected day", () => {
  const items = [stop("a1", at(0)), stop("b1", at(8)), stop("closed", at(0.1)), stop("a2", at(0.4))];
  const details = [detail("a1"), detail("b1"), detail("closed", "museum", hours("Closed")), detail("a2")];
  const store = storeWithDay(items);
  const result = plan(items, details);
  assert.equal(store.set(applyDayAutoPlanAtom, { blockId: "day-1", sourceItems: items, plan: result, moveTo: "day-2" }), true);
  const [day1, day2] = store.get(atoms.tripBlocksAtom);
  assert.deepEqual(day1.items.map((item) => item.id), order(result));
  assert.deepEqual(day2.items.map((item) => item.id), ["closed"]);
  assert.ok(day1.items.every((item) => /^\d{2}:\d{2}$/.test(item.time) && ["fixed", "calculated"].includes(item.timeSource)));
  assert.equal(store.get(autoPlanUndoAtom)["day-1"].movedCount, 1);

  assert.equal(store.set(undoDayAutoPlanAtom, "day-1"), true);
  const restored = store.get(atoms.tripBlocksAtom);
  assert.equal(restored[0].items, items);
  assert.deepEqual(restored[1].items, []);
});

test("a preview built from an older day is never applied", () => {
  const items = [stop("a", at(0)), stop("b", at(1))];
  const store = storeWithDay(items);
  const result = plan(items, [detail("a"), detail("b")]);
  store.set(atoms.tripBlocksAtom, (blocks) => blocks.map((block) => block.id === "day-1" ? { ...block, items: [...block.items] } : block));
  assert.equal(store.set(applyDayAutoPlanAtom, { blockId: "day-1", sourceItems: items, plan: result, moveTo: null }), false);
  store.set(atoms.plannerReadOnlyAtom, true);
  const current = store.get(atoms.tripBlocksAtom)[0].items;
  assert.equal(store.set(applyDayAutoPlanAtom, { blockId: "day-1", sourceItems: current, plan: result, moveTo: null }), false);
});

test("routed travel times replace estimates without moving pinned times, and Undo still works", () => {
  const items = [stop("ramen", at(0)), stop("a", at(1)), stop("b", at(2))];
  const details = [detail("ramen", "ramen_restaurant"), detail("a", "museum"), detail("b", "museum")];
  const store = storeWithDay(items);
  const result = plan(items, details);
  store.set(applyDayAutoPlanAtom, { blockId: "day-1", sourceItems: items, plan: result, moveTo: null });
  const planned = store.get(atoms.tripBlocksAtom)[0].items;
  const pinned = planned.filter((item) => item.timeSource === "fixed").map((item) => [item.id, item.time]);
  const travel = new Map(planned.map((item) => [item.id, 30]));
  assert.equal(store.set(refineAutoPlanTimesAtom, { blockId: "day-1", travelMinutesByItemId: travel, startsFromAnchor: false }), true);
  const refined = store.get(atoms.tripBlocksAtom)[0].items;
  assert.deepEqual(refined.filter((item) => item.timeSource === "fixed").map((item) => [item.id, item.time]), pinned);
  assert.ok(refined.some((item, index) => item.time !== planned[index].time));
  assert.equal(canUndoAutoPlan(store.get(atoms.tripBlocksAtom), store.get(autoPlanUndoAtom)["day-1"]), true);
  // Refinement runs once per plan.
  assert.equal(store.set(refineAutoPlanTimesAtom, { blockId: "day-1", travelMinutesByItemId: travel, startsFromAnchor: false }), false);
});
