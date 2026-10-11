import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { createStore } = await import("jotai");
const { hotel, hotelSearch, museum, arrivalDay, followingDay, stationA, stationB } = await import("./repeat-visits/data.ts");
const { buildTripLocationMarkers, createPlaceVisit, getPlaceUsage, orderVisitsForActiveBlock } = await import("../../app/feature/planner/planId/_components/itinerary/trip-location-markers.ts");
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { getTripRouteGroups } = await import("../../app/feature/planner/planId/_components/routes/trip-route.helpers.ts");
const { getGoogleMapsDirectionsLinks } = await import("../../app/feature/planner/planId/_components/routes/google-maps-export.ts");
const { getPlannerSnapshot, savePlannerSnapshot } = await import("../../app/feature/planner/_components/planner-api.ts");

test("adding a hotel again creates an independent visit and keeps the first visit intact", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [arrivalDay]);
  store.set(atoms.startPlaceSearchAtom, { blockId: arrivalDay.id, result: hotelSearch });
  assert.equal(store.get(atoms.selectedSearchPlaceIsAddedAtom), true);
  store.set(atoms.addSelectedPlaceToTripAtom);
  const visits = store.get(atoms.tripBlocksAtom)[0].items;
  assert.deepEqual(visits[0], hotel);
  const added = visits.at(-1);
  assert.notEqual(added.id, hotel.id);
  assert.equal(added.placeId, hotel.placeId);
  assert.equal(added.placeType, "hotel");
  assert.equal(added.isVisited, false);
  for (const field of ["notes", "time", "cost", "observedSocCheckpoint", "arrivalMode"]) assert.equal(added[field], undefined);
  assert.equal(store.get(atoms.selectedTripPlaceAtom).id, added.id);
});

test("editing or removing one visit leaves the other visit and its expense alone", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [{ ...arrivalDay, endAnchor: null, items: [hotel, createPlaceVisit(hotel, "return")] }]);
  store.set(atoms.tripExpensesAtom, [{ id: `place-cost-${hotel.id}`, amount: 2400 }, { id: "place-cost-return", amount: 20 }]);
  store.set(atoms.updatePlaceItemAtom, { blockId: arrivalDay.id, itemId: "return", updates: { notes: "Back after dinner", arrivalMode: "drive" } });
  const items = store.get(atoms.tripBlocksAtom)[0].items;
  assert.equal(items[0].notes, hotel.notes);
  assert.equal(items[0].arrivalMode, "walk");
  assert.equal(items[1].arrivalMode, "drive");
  store.set(atoms.removeItemFromBlockAtom, { blockId: arrivalDay.id, itemId: "return" });
  assert.deepEqual(store.get(atoms.tripBlocksAtom)[0].items, [hotel]);
  assert.deepEqual(store.get(atoms.tripExpensesAtom).map(expense => expense.id), [`place-cost-${hotel.id}`]);
});

test("saved-place repeat additions respect read-only plans and missing target blocks", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [arrivalDay]);
  store.set(atoms.plannerReadOnlyAtom, true);
  store.set(atoms.addPlaceVisitToBlockAtom, { blockId: arrivalDay.id, place: hotel });
  assert.deepEqual(store.get(atoms.tripBlocksAtom), [arrivalDay]);
  store.set(atoms.plannerReadOnlyAtom, false);
  store.set(atoms.addPlaceVisitToBlockAtom, { blockId: "deleted-day", place: hotel });
  assert.deepEqual(store.get(atoms.tripBlocksAtom), [arrivalDay]);
});

test("hotel stop and hotel End share one pin, numbered 2 with one additional visit", () => {
  const markers = buildTripLocationMarkers([arrivalDay]);
  const marker = markers.find(marker => marker.visits.some(visit => visit.itemId === hotel.id));
  assert.equal(markers.length, 3);
  assert.deepEqual(marker.visits.map(visit => [visit.edge, visit.number]), [["stop", 2], ["end", 4]]);
  assert.equal(marker.visits.length - 1, 1);
  assert.match(getPlaceUsage([arrivalDay], hotel, arrivalDay.id).label, /Already in Day 1 · 2 visits/);
});

test("overnight roles group with the first day's check-in and active-day/selected visits lead", () => {
  const marker = buildTripLocationMarkers([arrivalDay, followingDay]).find(marker => marker.visits.length === 4);
  assert.ok(marker);
  assert.equal(orderVisitsForActiveBlock(marker.visits, followingDay.id)[0].blockId, followingDay.id);
  assert.equal(orderVisitsForActiveBlock(marker.visits, followingDay.id, hotel.id)[0].itemId, hotel.id);
});

test("provider identity groups coordinate drift while distinct co-located places stay named", () => {
  const returnVisit = { ...createPlaceVisit(hotel, "return"), lat: hotel.lat + 0.0001 };
  const coLocated = { ...museum, lat: hotel.lat, lng: hotel.lng };
  const markers = buildTripLocationMarkers([{ ...arrivalDay, startAnchor: null, endAnchor: null, items: [hotel, coLocated, returnVisit] }]);
  assert.equal(markers.length, 1);
  assert.deepEqual(markers[0].visits.map(visit => visit.name), [hotel.name, museum.name, hotel.name]);
  assert.equal(getPlaceUsage([{ ...arrivalDay, startAnchor: null, endAnchor: null, items: [coLocated] }], hotel).isAdded, false);
});

test("same coordinates in separate namespaces do not confuse visit usage", () => {
  const otherPlace = { ...hotel, placeId: "MAPBOX:ChIHotel", name: "Different place" };
  assert.equal(getPlaceUsage([{ ...arrivalDay, startAnchor: null, endAnchor: null, items: [otherPlace] }], hotel).isAdded, false);
});

test("a hotel used on another day is indicated without counting it as this day's visit", () => {
  const away = { id: museum.placeId, kind: "PLACE", name: museum.name, lat: museum.lat, lng: museum.lng };
  const usage = getPlaceUsage([arrivalDay, { ...followingDay, startAnchor: away, endAnchor: away }], hotel, followingDay.id);
  assert.equal(usage.targetLabel, "Day 2");
  assert.equal(usage.label, "Already in Day 1");
});

test("Station A -> B -> C -> B -> A keeps both station journeys and per-visit modes", () => {
  const stationBReturn = createPlaceVisit(stationB, "station-b-return");
  const stationAReturn = createPlaceVisit(stationA, "station-a-return");
  const day = { ...arrivalDay, startAnchor: null, endAnchor: null, items: [stationA, stationB, { ...museum, lat: 13.77 }, { ...stationBReturn, arrivalMode: "walk" }, stationAReturn] };
  const [group] = getTripRouteGroups([day]);
  assert.deepEqual(group.points.map(point => point.id), [stationA.id, stationB.id, museum.id, stationBReturn.id, stationAReturn.id]);
  assert.deepEqual(group.points.map(point => point.arrivalMode ?? "drive"), ["drive", "transit", "drive", "walk", "transit"]);
  const markers = buildTripLocationMarkers([day]);
  assert.equal(markers.length, 3);
  assert.deepEqual(markers.map(marker => marker.visits.length), [2, 2, 1]);
  const link = new URL(getGoogleMapsDirectionsLinks(day)[0].href);
  assert.equal(link.searchParams.get("origin"), link.searchParams.get("destination"));
  assert.equal(link.searchParams.get("waypoints"), "13.760000,100.520000|13.770000,100.520000|13.760000,100.520000");
});

test("hotel check-in and return retain separate IDs in the save/load API contract", async () => {
  const originalFetch = globalThis.fetch;
  const blocks = [{ ...arrivalDay, items: [hotel, museum, createPlaceVisit(hotel, "return")] }];
  const budget = { currency: "THB", amount: 5000, expenses: [] };
  let stored = { blocks: [], budget, version: 1, savedAt: "2026-10-11T00:00:00Z", capabilities: ["day-anchors", "leg-travel-mode-v1"] };
  globalThis.fetch = async (_url, options) => {
    if (options?.method === "PUT") {
      const body = JSON.parse(options.body);
      stored = { ...stored, blocks: body.blocks, budget: body.budget, version: 2 };
      return Response.json({ version: 2, savedAt: stored.savedAt });
    }
    return Response.json(stored);
  };
  try {
    await savePlannerSnapshot("test-trip", blocks, budget, 1);
    const loaded = await getPlannerSnapshot("test-trip");
    assert.deepEqual(loaded.blocks[0].items.map(item => item.id), [hotel.id, museum.id, "return"]);
    assert.equal(loaded.blocks[0].items[0].notes, hotel.notes);
    assert.equal(loaded.blocks[0].items[2].notes, undefined);
    assert.equal(loaded.blocks[0].endAnchor.id, "ChIHotel");
  } finally { globalThis.fetch = originalFetch; }
});
