import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createStore, Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

register(new URL("../support/typescript-loader.mjs", import.meta.url));
register("data:text/javascript," + encodeURIComponent(`export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', shortCircuit: true,
    source: 'export default new Proxy({}, { get: (_, key) => key });' };
  if (url.endsWith('/next/image.js')) return { format: 'module', shortCircuit: true,
    source: 'import { createElement } from "react"; export default function Image({ unoptimized, ...props }) { return createElement("img", props); }' };
  return next(url, context);
}`), import.meta.url);

const sections = await import("../../app/feature/planner/planId/_components/itinerary/day-sections.ts");
const { resolveDayDestinations } = await import("../../app/feature/planner/planId/_components/itinerary/day-destinations.ts");
const { buildTripLocationMarkers } = await import("../../app/feature/planner/planId/_components/itinerary/trip-location-markers.ts");
const { getRouteDrawPieces } = await import("../../app/feature/planner/planId/_components/routes/route-draw.ts");
const { getTripBlockColorById } = await import("../../app/feature/planner/planId/_components/constants/trip-block-colors.ts");
const { getItemInsertionLabel } = await import("../../app/feature/planner/planId/_components/block/item-insertion.ts");
const { isPlannerBlocks } = await import("../../app/feature/planner/_components/planner-api.ts");
const { toSharedPlanBlocks } = await import("../../app/feature/planner/_components/share/shared-plan-blocks.ts");
const { SortableBlockItems } = await import("../../app/feature/planner/planId/_components/block/sortable-block-items.tsx");
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const sectionAtoms = await import("../../app/feature/planner/planId/_components/itinerary/day-sections.atoms.ts");

const kyoto = { id: "kyoto", name: "Kyoto", lat: 35.01, lng: 135.77 };
const osaka = { id: "osaka", name: "Osaka", lat: 34.69, lng: 135.5 };
const stop = (id, lat = 35) => ({ id, type: "place", placeId: `GOOGLE:${id}`, name: id, address: "Japan", lat, lng: 135.6 });
const section = (id, extra = {}) => ({ id, type: "section", title: "", colorId: null, destination: null, ...extra });

const day = {
  id: "day-1", kind: "itinerary", title: "Day 1", date: "2026-10-12", colorId: "blue",
  items: [
    stop("fushimi"),
    stop("kiyomizu"),
    section("osaka-part", { title: "Afternoon", colorId: "coral", destination: osaka }),
    stop("castle", 34.68),
    { id: "note", type: "note", content: "Dinner" },
    section("evening"),
    stop("umeda", 34.7),
  ],
};
const nextDay = { id: "day-2", kind: "itinerary", title: "Day 2", date: "2026-10-13", colorId: "teal", items: [stop("nara")] };

test("each item takes the colour of the section above it, and a section without one keeps the day's", () => {
  const colors = sections.getItemColorIds(day);
  assert.equal(colors.get("fushimi"), "blue");
  assert.equal(colors.get("osaka-part"), "coral");
  assert.equal(colors.get("castle"), "coral");
  assert.equal(colors.get("note"), "coral");
  assert.equal(colors.get("umeda"), "blue");
  assert.equal(sections.getDayEndColorId(day), "blue");
});

test("the day lists the cities it passes through in order, collapsing repeats", () => {
  const twice = { ...day, items: [...day.items, section("again", { destination: osaka })] };
  assert.deepEqual(sections.getDayCities(twice, kyoto).map((city) => city.name), ["Kyoto", "Osaka"]);
  assert.deepEqual(sections.getDayCities({ ...day, items: [stop("a")] }, kyoto).map((city) => city.name), ["Kyoto"]);
});

test("the city in effect at a gap is the latest section city above it", () => {
  assert.equal(sections.getDestinationAt(day, 1, kyoto).name, "Kyoto");
  assert.equal(sections.getDestinationAt(day, 3, kyoto).name, "Osaka");
  assert.equal(sections.getDestinationAt(day, day.items.length, kyoto).name, "Osaka");
});

test("a day that moves on to another city hands that city to the next day", () => {
  const destinations = resolveDayDestinations([day, nextDay], kyoto);
  assert.equal(destinations.get("day-1").name, "Kyoto");
  assert.equal(destinations.get("day-2").name, "Osaka");
});

test("an explicit destination on the next day still wins over the city it inherits", () => {
  const destinations = resolveDayDestinations([day, { ...nextDay, destination: kyoto }], kyoto);
  assert.equal(destinations.get("day-2").name, "Kyoto");
});

test("folding a section hides only the items it held when folded, never the divider", () => {
  const folded = new Map([["osaka-part", sections.getSectionItemIds(day, "osaka-part")]]);
  assert.deepEqual([...sections.getHiddenItemIds(day, folded)], ["castle", "note"]);

  const withNewStop = { ...day, items: [...day.items.slice(0, 5), stop("added"), ...day.items.slice(5)] };
  assert.deepEqual([...sections.getHiddenItemIds(withNewStop, folded)], ["castle", "note"]);
});

test("section summaries count stops and other items separately", () => {
  const summaries = sections.getSectionSummaries(day);
  assert.deepEqual(summaries.get("osaka-part"), { itemCount: 2, stopCount: 1 });
  assert.deepEqual(summaries.get("evening"), { itemCount: 1, stopCount: 1 });
  assert.deepEqual(sections.getSectionSummaries(day, new Set(["castle"])).get("osaka-part"), { itemCount: 1, stopCount: 1 });
});

test("map pins and route legs into a coloured section use that colour", () => {
  const coral = getTripBlockColorById("coral");
  const visits = buildTripLocationMarkers([day]).flatMap((marker) => marker.visits);
  assert.equal(visits.find((visit) => visit.itemId === "castle").colorId, "coral");
  assert.equal(visits.find((visit) => visit.itemId === "fushimi").colorId, "blue");

  const colors = sections.getRouteColorsById([day]);
  const segment = (toItemId) => ({
    id: `leg-${toItemId}`, blockId: "day-1", fromItemId: "x", toItemId, status: "ok", mode: "drive",
    geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
  });
  const [intoOsaka] = getRouteDrawPieces([segment("castle")], colors, "#000000");
  const [intoKyoto] = getRouteDrawPieces([segment("kiyomizu")], colors, "#000000");
  assert.equal(intoOsaka.color, coral.mapColor);
  assert.equal(intoKyoto.color, getTripBlockColorById("blue").mapColor);
});

test("an insertion gap before a named section says which section it is", () => {
  assert.equal(getItemInsertionLabel(day, "osaka-part"), "Before the Afternoon section");
});

test("saved and drafted plans accept a section and reject one with a malformed colour", () => {
  assert.equal(isPlannerBlocks([day]), true);
  assert.equal(isPlannerBlocks([{ ...day, items: [section("bad", { colorId: "#ff0000" })] }]), false);
  assert.equal(isPlannerBlocks([{ ...day, items: [{ id: "bad", type: "section" }] }]), false);
});

test("a shared plan keeps its sections, folding the city name into the title", () => {
  const [shared] = toSharedPlanBlocks({ days: [{ label: "Day 1", items: [
    { type: "section", name: "Afternoon", colorId: "coral", city: "Osaka" },
    { type: "section", colorId: "not-a-colour" },
  ] }] });
  assert.deepEqual(shared.items[0], { id: "shared-day-1-item-1", type: "section", title: "Afternoon · Osaka", colorId: "coral", destination: null });
  assert.equal(shared.items[1].colorId, null);
});

test("adding a section at a gap inserts an empty divider there that keeps the day's colour", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  const id = store.set(atoms.addSectionToBlockAtom, { blockId: "day-1", beforeItemId: "kiyomizu" });
  const items = store.get(atoms.tripBlocksAtom)[0].items;
  assert.equal(items[1].id, id);
  assert.deepEqual({ ...items[1], id: "x" }, { id: "x", type: "section", title: "", colorId: null, destination: null });
});

test("a read-only planner cannot add a section", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  store.set(atoms.plannerReadOnlyAtom, true);
  assert.equal(store.set(atoms.addSectionToBlockAtom, { blockId: "day-1" }), undefined);
  assert.equal(store.get(atoms.tripBlocksAtom)[0].items.length, day.items.length);
});

test("removing a divider keeps the stops it covered in the day", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  store.set(atoms.removeItemFromBlockAtom, { blockId: "day-1", itemId: "osaka-part" });
  const ids = store.get(atoms.tripBlocksAtom)[0].items.map((item) => item.id);
  assert.deepEqual(ids, ["fushimi", "kiyomizu", "castle", "note", "evening", "umeda"]);
});

function render(store) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(Provider, { store }, React.createElement(SortableBlockItems, { block: store.get(atoms.tripBlocksAtom)[0] }))));
  client.clear();
  return html;
}

test("a folded section shows its divider and a summary but not its stops", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  store.set(sectionAtoms.toggleSectionCollapsedAtom, { blockId: "day-1", sectionId: "osaka-part" });
  const html = render(store);
  assert.match(html, /aria-label="Section: Afternoon"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /1 stop, 1 item hidden/);
  assert.doesNotMatch(html, /trip-item-castle/);
  assert.match(html, /trip-item-umeda/);
});

test("revealing an item inside a folded section unfolds it", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  store.set(sectionAtoms.toggleSectionCollapsedAtom, { blockId: "day-1", sectionId: "osaka-part" });
  store.set(sectionAtoms.expandSectionOfItemAtom, { blockId: "day-1", itemId: "castle" });
  assert.equal(store.get(sectionAtoms.collapsedSectionsAtom).size, 0);
  assert.match(render(store), /trip-item-castle/);
});

test("a named section reads like the destination card, with its city and a Change control", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  const html = render(store);
  assert.match(html, /Section in Osaka/);
  assert.match(html, /aria-label="Change Afternoon: name, city and colour"/);
  assert.match(html, /aria-expanded="false" aria-controls="[^"]+" aria-label="Change Afternoon/);
});

test("a new, empty section opens its editor so it can be named", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  const html = render(store);
  assert.match(html, /aria-expanded="true" aria-controls="[^"]+" aria-label="Change New section/);
  assert.match(html, />Section name<\/label>/);
  assert.match(html, /Remove section/);
});

test("a read-only section has no Change control", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [day]);
  store.set(atoms.plannerReadOnlyAtom, true);
  const html = render(store);
  assert.match(html, /aria-label="Section: Afternoon"/);
  assert.doesNotMatch(html, /Change Afternoon|Section name/);
});
