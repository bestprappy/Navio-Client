import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createStore, Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { getPlaceDestinations } = await import(
  "../../app/feature/planner/planId/_components/place/place-destinations.ts"
);
const { AddPlaceMenu } = await import(
  "../../app/feature/planner/planId/_components/place/add-place-menu.tsx"
);
const { PlacePreviewPanel } = await import(
  "../../app/feature/planner/planId/_components/place/place-preview-panel.tsx"
);
const { addMyListBlockAtom, addPlaceVisitToBlockAtom, plannerReadOnlyAtom, tripBlocksAtom } = await import(
  "../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts"
);

const garden = { placeId: "GOOGLE:garden", name: "Garden", address: "Town", lat: 1, lng: 2 };
const blocks = [
  { id: "starting-part-main", kind: "list", title: "Before you go", date: "", colorId: "teal", items: [] },
  { id: "ideas", kind: "list", title: "Ideas", date: "", colorId: "rose",
    items: [{ id: "saved", type: "place", ...garden, placeId: "garden" }] },
  { id: "untitled", kind: "list", title: "  ", date: "", colorId: "teal", items: [] },
  { id: "d2", kind: "itinerary", title: "", date: "2026-11-01", colorId: "violet", items: [] },
  { id: "d1", kind: "itinerary", title: "", date: "2026-10-31", colorId: "teal", items: [] },
];

test("destinations list every saved list except Starting Part, then days in date order", () => {
  const { lists, days } = getPlaceDestinations(blocks, garden);
  assert.deepEqual(lists.map((list) => [list.blockId, list.label]), [["ideas", "Ideas"], ["untitled", "Untitled list"]]);
  assert.deepEqual(days.map((day) => [day.blockId, day.label, day.detail]), [
    ["d1", "Day 1", "Sat 31 Oct"],
    ["d2", "Day 2", "Sun 1 Nov"],
  ]);
});

test("a destination already holding the place is marked, recognising legacy provider IDs", () => {
  const { lists, days } = getPlaceDestinations(blocks, garden);
  assert.deepEqual(lists.map((list) => list.contains), [true, false]);
  assert.deepEqual(days.map((day) => day.contains), [false, false]);
});

test("a new list is returned so the place can be added to it straight away", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks);
  const listId = store.set(addMyListBlockAtom);
  const itemId = store.set(addPlaceVisitToBlockAtom, { blockId: listId, place: garden });
  const list = store.get(tripBlocksAtom).find((block) => block.id === listId);
  assert.equal(list.kind, "list");
  assert.deepEqual(list.items.map((item) => [item.id, item.name]), [[itemId, "Garden"]]);
});

test("the add button carries a menu of other destinations, which a shared plan hides", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks);
  const client = new QueryClient();
  const render = () => renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(Provider, { store }, React.createElement(PlacePreviewPanel, {
      compact: true, place: { name: "Garden", address: "Town" }, isAdded: false, onClose() {}, onAddToTrip() {},
      addMenu: React.createElement(AddPlaceMenu, { place: garden }),
    }))));
  const html = render();
  assert.match(html, /Add to trip/);
  assert.match(html, /aria-label="Choose where to add Garden"/);
  assert.match(html, /rounded-r-none/);
  store.set(plannerReadOnlyAtom, true);
  assert.doesNotMatch(render(), /Choose where to add Garden/);
  client.clear();
});
