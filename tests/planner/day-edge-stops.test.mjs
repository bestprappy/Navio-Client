import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { createStore } = await import("jotai");
const { hotel, temple, ryokan, market, charger, packingNote, home, firstDay, secondDay } = await import("./day-edge-stops/data.ts");
const { resolveDayAnchors, placeItemToAnchor, keepDayEdgeStopsInPlace, moveStopToDayEdge } = await import("../../app/feature/planner/planId/_components/itinerary/day-anchors.ts");
const { getTripRouteGroups } = await import("../../app/feature/planner/planId/_components/routes/trip-route.helpers.ts");
const { buildTripLocationMarkers } = await import("../../app/feature/planner/planId/_components/itinerary/trip-location-markers.ts");
const { arrangeDayItems } = await import("../../app/feature/planner/planId/_components/auto-plan/day-auto-plan.ts");
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");

function storeWith(blocks) {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, blocks);
  return store;
}
const day = (store, id = firstDay.id) => store.get(atoms.tripBlocksAtom).find((block) => block.id === id);
const ids = (block) => block.items.map((item) => item.id);

test("marking the last stop as the end keeps it as a full card with its time and notes", () => {
  const store = storeWith([firstDay]);
  store.set(atoms.tripExpensesAtom, [{ id: `place-cost-${ryokan.id}`, amount: 12000, label: "Ryokan", categoryId: "stay" }]);
  store.set(atoms.markPlaceAsDayEdgeAtom, { blockId: firstDay.id, itemId: ryokan.id, edge: "end" });
  const block = day(store);
  assert.deepEqual(ids(block), ["hotel", "temple", "ryokan"]);
  assert.equal(block.items.at(-1).time, "18:30");
  assert.deepEqual(block.endAnchor, placeItemToAnchor(ryokan));
  assert.equal(store.get(atoms.tripExpensesAtom).length, 1);
});

test("marking the first stop as the start replaces the separate start and keeps its schedule", () => {
  const store = storeWith([firstDay]);
  store.set(atoms.markPlaceAsDayEdgeAtom, { blockId: firstDay.id, itemId: hotel.id, edge: "start" });
  const block = day(store);
  const resolved = resolveDayAnchors([block]).get(block.id);
  assert.equal(resolved.startStopId, hotel.id);
  assert.equal(resolved.start, null);
  assert.equal(resolved.startPlace.name, hotel.name);
  assert.deepEqual(block.items[0].schedule, hotel.schedule);
});

test("a stop that is the day's start or end is routed once, not as a second zero-length visit", () => {
  const block = { ...firstDay, startAnchor: placeItemToAnchor(hotel), endAnchor: placeItemToAnchor(ryokan) };
  const [route] = getTripRouteGroups([block]);
  assert.deepEqual(route.points.map((point) => point.id), ["hotel", "temple", "ryokan"]);
});

test("the next day still wakes up at a stop the previous day ended at", () => {
  const blocks = [{ ...firstDay, endAnchor: placeItemToAnchor(ryokan) }, secondDay];
  const next = resolveDayAnchors(blocks).get(secondDay.id);
  assert.equal(next.start.name, ryokan.name);
  assert.equal(next.startIsCarriedOver, true);
  assert.equal(next.startStopId, null);
});

test("a start carried over from yesterday stays a separate place even when today revisits it first", () => {
  const blocks = [{ ...firstDay, endAnchor: placeItemToAnchor(ryokan) }, { ...secondDay, items: [ryokan, market] }];
  const next = resolveDayAnchors(blocks).get(secondDay.id);
  assert.equal(next.startStopId, null);
  assert.equal(next.start.name, ryokan.name);
});

test("map pins name the start and end stops by their role", () => {
  const block = { ...firstDay, startAnchor: placeItemToAnchor(hotel), endAnchor: placeItemToAnchor(ryokan) };
  const visits = buildTripLocationMarkers([block]).flatMap((marker) => marker.visits);
  assert.equal(visits.find((visit) => visit.itemId === hotel.id).dayRole, "start");
  assert.equal(visits.find((visit) => visit.itemId === ryokan.id).dayRole, "end");
  assert.equal(visits.find((visit) => visit.itemId === temple.id).dayRole, undefined);
  assert.equal(visits.some((visit) => visit.edge !== "stop"), false);
});

test("a place added after the end stop is moved before it", () => {
  const store = storeWith([{ ...firstDay, endAnchor: placeItemToAnchor(ryokan) }]);
  store.set(atoms.tripBlocksAtom, (blocks) => blocks.map((block) => ({ ...block, items: [...block.items, market] })));
  assert.deepEqual(ids(day(store)), ["hotel", "temple", "market", "ryokan"]);
});

test("a place dragged above the start stop lands just after it", () => {
  const store = storeWith([{ ...firstDay, startAnchor: placeItemToAnchor(hotel) }]);
  store.set(atoms.reorderBlockItemsAtom, { blockId: firstDay.id, activeItemId: ryokan.id, overItemId: hotel.id });
  assert.deepEqual(ids(day(store)), ["hotel", "ryokan", "temple"]);
});

test("unchanged days keep their identity when the edges are already in place", () => {
  const blocks = [{ ...firstDay, endAnchor: placeItemToAnchor(ryokan) }, secondDay];
  const next = blocks.map((block) => block.id === secondDay.id ? { ...block, title: "Market day" } : block);
  const kept = keepDayEdgeStopsInPlace(blocks, next);
  assert.equal(kept, next);
  assert.equal(kept[0], blocks[0]);
});

test("a stop never becomes the start or end without being chosen", () => {
  const store = storeWith([firstDay]);
  store.set(atoms.reorderBlockItemsAtom, { blockId: firstDay.id, activeItemId: ryokan.id, overItemId: hotel.id });
  assert.deepEqual(ids(day(store)), ["ryokan", "hotel", "temple"]);
  assert.deepEqual(day(store).startAnchor, home);
});

test("choosing a place the day already visits as its end moves that stop to the end", () => {
  const store = storeWith([firstDay]);
  store.set(atoms.setDayAnchorAtom, { blockId: firstDay.id, edge: "end", anchor: placeItemToAnchor(temple) });
  assert.deepEqual(ids(day(store)), ["hotel", "ryokan", "temple"]);
  assert.equal(resolveDayAnchors([day(store)]).get(firstDay.id).endStopId, temple.id);
});

test("deleting the end stop also clears the end so no bare card replaces it", () => {
  const store = storeWith([{ ...firstDay, endAnchor: placeItemToAnchor(ryokan) }]);
  store.set(atoms.removeItemFromBlockAtom, { blockId: firstDay.id, itemId: ryokan.id });
  assert.equal(day(store).endAnchor, null);
  assert.deepEqual(ids(day(store)), ["hotel", "temple"]);
});

test("deleting an ordinary stop leaves the day's start and end alone", () => {
  const store = storeWith([{ ...firstDay, endAnchor: placeItemToAnchor(ryokan) }]);
  store.set(atoms.removeItemFromBlockAtom, { blockId: firstDay.id, itemId: temple.id });
  assert.deepEqual(day(store).endAnchor, placeItemToAnchor(ryokan));
  assert.deepEqual(day(store).startAnchor, home);
});

test("making a start stop a regular stop keeps the card and returns the day to no separate start", () => {
  const store = storeWith([{ ...firstDay, startAnchor: placeItemToAnchor(hotel) }]);
  store.set(atoms.clearDayEdgeStopAtom, { blockId: firstDay.id, itemId: hotel.id });
  assert.equal(day(store).startAnchor, null);
  assert.deepEqual(ids(day(store)), ["hotel", "temple", "ryokan"]);
});

test("a charger is never the start or end stop", () => {
  const block = { ...firstDay, items: [hotel, temple, charger], endAnchor: placeItemToAnchor(charger) };
  assert.equal(resolveDayAnchors([block]).get(block.id).endStopId, null);
});

test("moving a stop to an edge leaves notes where they were", () => {
  const items = [packingNote, temple, hotel, ryokan];
  assert.deepEqual(moveStopToDayEdge(items, hotel.id, "start").map((item) => item.id), ["note", "hotel", "temple", "ryokan"]);
  assert.equal(moveStopToDayEdge(items, ryokan.id, "end"), items);
});

test("auto plan orders the stops between the start and end stops and leaves the edges in place", () => {
  const items = [hotel, temple, market, ryokan];
  const plan = { stops: [{ itemId: market.id, start: 600, end: 660, pin: null }, { itemId: temple.id, start: 700, end: 760, pin: null }], unplanned: [], lastIds: [] };
  const { items: arranged } = arrangeDayItems(items, plan, true, { startStopId: hotel.id, endStopId: ryokan.id });
  assert.deepEqual(arranged.map((item) => item.id), ["hotel", "market", "temple", "ryokan"]);
  assert.equal(arranged[0].time, hotel.time);
  assert.equal(arranged.at(-1).time, ryokan.time);
});
