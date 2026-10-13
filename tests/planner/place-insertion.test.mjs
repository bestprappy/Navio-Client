import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });

const { createStore } = await import("jotai");
const { longDay, secondDay, searchedPlace, mixedDay, charger } = await import("./place-insertion/data.ts");
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { getItemInsertionLabel } = await import("../../app/feature/planner/planId/_components/block/item-insertion.ts");

function startInsertion(store, beforeItemId = "stop-21") {
  store.set(atoms.startPlaceSearchAtom, { blockId: longDay.id, beforeItemId, result: searchedPlace });
}

test("a searched place goes between stops 20 and 21 in a 50-place day", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [longDay, secondDay]);
  startInsertion(store);
  assert.equal(store.get(atoms.selectedSearchPlaceInsertionAtom).label, "Between stops 20 and 21");
  const id = store.set(atoms.addSelectedPlaceToTripAtom);
  const [day, unchangedDay] = store.get(atoms.tripBlocksAtom);
  assert.equal(day.items.length, 51);
  assert.equal(day.items[19].id, "stop-20");
  assert.equal(day.items[20].id, id);
  assert.equal(day.items[20].name, searchedPlace.name);
  assert.equal(day.items[21].id, "stop-21");
  assert.deepEqual(day.items.filter(item => item.id !== id), longDay.items);
  assert.equal(unchangedDay, secondDay);
  assert.equal(store.get(atoms.selectedTripPlaceItemIdAtom), id);
  assert.equal(store.get(atoms.activeSearchAtom), null);
});

test("first-position insertion and normal append stay distinct", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]);
  startInsertion(store, "stop-1");
  const firstId = store.set(atoms.addSelectedPlaceToTripAtom);
  assert.equal(store.get(atoms.tripBlocksAtom)[0].items[0].id, firstId);
  startInsertion(store);
  store.set(atoms.startPlaceSearchAtom, { blockId: longDay.id, result: searchedPlace });
  assert.equal(store.get(atoms.activeSearchAtom).beforeItemId, undefined);
  const lastId = store.set(atoms.addSelectedPlaceToTripAtom);
  assert.equal(store.get(atoms.tripBlocksAtom)[0].items.at(-1).id, lastId);
});

test("search result navigation keeps the chosen insertion point", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]);
  store.set(atoms.startPlaceSearchAtom, {
    blockId: longDay.id, beforeItemId: "stop-21", results: [searchedPlace, { ...searchedPlace, id: "GOOGLE:Other", name: "Other museum" }],
  });
  store.set(atoms.stepSearchResultAtom, { direction: "next" });
  store.set(atoms.selectSearchResultAtom, { index: 0 });
  assert.equal(store.get(atoms.activeSearchAtom).beforeItemId, "stop-21");
  assert.equal(store.get(atoms.selectedSearchPlaceInsertionAtom).label, "Between stops 20 and 21");
});

test("reordering while a preview is open keeps insertion before the chosen item", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]); startInsertion(store);
  store.set(atoms.reorderBlockItemsAtom, { blockId: longDay.id, activeItemId: "stop-21", overItemId: "stop-30" });
  const id = store.set(atoms.addSelectedPlaceToTripAtom);
  const items = store.get(atoms.tripBlocksAtom)[0].items;
  assert.equal(items[items.findIndex(item => item.id === "stop-21") - 1].id, id);
});

test("a removed insertion point blocks adding instead of sending it to the end", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]); startInsertion(store);
  store.set(atoms.removeItemFromBlockAtom, { blockId: longDay.id, itemId: "stop-21" });
  const before = store.get(atoms.tripBlocksAtom);
  assert.equal(store.get(atoms.selectedSearchPlaceInsertionAtom).isValid, false);
  assert.equal(store.set(atoms.addSelectedPlaceToTripAtom), undefined);
  assert.equal(store.get(atoms.tripBlocksAtom), before);
});

test("read-only or deleted days cannot receive inserted places", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]); startInsertion(store);
  store.set(atoms.plannerReadOnlyAtom, true);
  assert.equal(store.set(atoms.addSelectedPlaceToTripAtom), undefined);
  assert.equal(store.get(atoms.tripBlocksAtom)[0], longDay);
  store.set(atoms.plannerReadOnlyAtom, false);
  store.set(atoms.tripBlocksAtom, []);
  assert.equal(store.set(atoms.addSelectedPlaceToTripAtom), undefined);
  assert.equal(store.get(atoms.selectedSearchPlaceInsertionAtom).isValid, false);
});

test("notes, checklists, anchors and chargers do not confuse numbering or raw insertion order", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [mixedDay]);
  assert.equal(getItemInsertionLabel(mixedDay, mixedDay.items[0].id, true), "Before stop 2");
  assert.equal(getItemInsertionLabel(mixedDay, "charger", true), "Before charging stop");
  assert.equal(getItemInsertionLabel(mixedDay, "checklist", true), "Before checklist");
  const id = store.set(atoms.addPlaceVisitToBlockAtom, { blockId: mixedDay.id, beforeItemId: "charger", place: searchedPlace });
  const items = store.get(atoms.tripBlocksAtom)[0].items;
  assert.equal(items[1].id, "note");
  assert.equal(items[2].id, id);
  assert.equal(items[3].id, "charger");
  assert.deepEqual(store.get(atoms.tripBlocksAtom)[0].startAnchor, mixedDay.startAnchor);
});

test("inserting another visit does not inherit earlier time, notes or progress", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [mixedDay]);
  const id = store.set(atoms.addPlaceVisitToBlockAtom, { blockId: mixedDay.id, beforeItemId: "note", place: mixedDay.items[0] });
  const items = store.get(atoms.tripBlocksAtom)[0].items;
  assert.equal(items[0], mixedDay.items[0]);
  const visit = items.find(item => item.id === id);
  assert.equal(visit.placeId, mixedDay.items[0].placeId);
  assert.equal(visit.time, undefined);
  assert.equal(visit.notes, undefined);
  assert.equal(visit.isVisited, false);
});

test("notes and checklists insert at the chosen gap without changing place order", () => {
  const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]);
  const noteId = store.set(atoms.addNoteToBlockAtom, { blockId: longDay.id, beforeItemId: "stop-21" });
  const checklistId = store.set(atoms.addChecklistToBlockAtom, { blockId: longDay.id, beforeItemId: "stop-21" });
  const items = store.get(atoms.tripBlocksAtom)[0].items;
  assert.deepEqual(items.slice(19, 23).map(item => item.id), ["stop-20", noteId, checklistId, "stop-21"]);
  assert.equal(items[20].type, "note");
  assert.equal(items[21].items[0].checked, false);
  assert.deepEqual(items.filter(item => item.type === "place"), longDay.items);
});

test("both EV add paths keep the search result's chosen insertion point", () => {
  for (const usePreview of [true, false]) {
    const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]);
    store.set(atoms.setEvChargerResultsAtom, [{ charger, targetBlockId: longDay.id, targetPlaceId: "stop-20", beforeItemId: "stop-21", distanceKm: 0 }]);
    store.set(atoms.selectEvChargerAtom, charger.id);
    assert.equal(store.get(atoms.selectedEvChargerInsertionAtom).label, "Between stops 20 and 21");
    const id = usePreview ? store.set(atoms.addSelectedEvChargerToTripAtom) : store.set(atoms.addEvChargerToBlockAtom, { blockId: longDay.id, beforeItemId: "stop-21", charger });
    const items = store.get(atoms.tripBlocksAtom)[0].items;
    assert.deepEqual(items.slice(19, 22).map(item => item.id), ["stop-20", id, "stop-21"]);
    assert.equal(items[20].placeId, `ev-charger:${charger.id}`);
    assert.equal(store.set(atoms.addEvChargerToBlockAtom, { blockId: longDay.id, beforeItemId: "stop-21", charger }), id);
    assert.equal(store.get(atoms.tripBlocksAtom)[0].items.length, 51);
  }
});

test("all four insertion options reject removed positions and read-only changes", () => {
  for (const mode of ["removed", "readonly"]) {
    const store = createStore(); store.set(atoms.tripBlocksAtom, [longDay]);
    if (mode === "removed") store.set(atoms.removeItemFromBlockAtom, { blockId: longDay.id, itemId: "stop-21" });
    else store.set(atoms.plannerReadOnlyAtom, true);
    const before = store.get(atoms.tripBlocksAtom);
    const payload = { blockId: longDay.id, beforeItemId: "stop-21" };
    assert.equal(store.set(atoms.addNoteToBlockAtom, payload), undefined);
    assert.equal(store.set(atoms.addChecklistToBlockAtom, payload), undefined);
    assert.equal(store.set(atoms.addEvChargerToBlockAtom, { ...payload, charger }), undefined);
    assert.equal(store.set(atoms.addPlaceVisitToBlockAtom, { ...payload, place: searchedPlace }), undefined);
    assert.equal(store.get(atoms.tripBlocksAtom), before);
  }
});
