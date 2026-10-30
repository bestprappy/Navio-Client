import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createStore, Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
register("data:text/javascript," + encodeURIComponent(`export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', shortCircuit: true, source: 'export default {}' };
  if (url.endsWith('/next/image.js')) return { format: 'module', shortCircuit: true,
    source: 'import { createElement } from "react"; export default function Image({ unoptimized, fill, ...props }) { return createElement("img", props); }' };
  return next(url, context);
}`), import.meta.url);
const { MyListSummary } = await import("../../app/feature/planner/planId/_components/list/my-list-summary.tsx");
const { BeforeYouGoSection } = await import("../../app/feature/planner/planId/_components/list/starting-part.tsx");
const { ReaderIntroduction } = await import("../../app/feature/planner/_components/share/reader/reader-introduction.tsx");
const { scheduleSavedPlacesAtom } = await import("../../app/feature/planner/planId/_components/list/saved-places.atoms.ts");
const { getDayDestinations } = await import("../../app/feature/planner/planId/_components/place/place-destinations.ts");
const { plannerReadOnlyAtom, tripBlocksAtom } = await import(
  "../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts"
);

const place = (id, name, lat) => ({ id, type: "place", placeId: `GOOGLE:${id}`, name, address: "Bangkok", lat, lng: 100.5 });
const palace = place("palace", "Grand Palace", 13.75);
const temple = place("temple", "Wat Pho", 13.746);
const blocks = () => [
  { id: "starting-part-main", kind: "list", title: "Before you go", date: "", colorId: "teal",
    items: [{ id: "starting-part-note", type: "note", content: "Bring a scarf for the temples." }] },
  { id: "ideas", kind: "list", title: "Ideas", date: "", colorId: "rose", items: [palace, temple] },
  { id: "d1", kind: "itinerary", title: "", date: "2026-10-31", colorId: "teal",
    items: [{ ...palace, id: "visit" }] },
];

function render(store, element) {
  const client = new QueryClient();
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(Provider, { store }, element)));
  client.clear();
  return html;
}

test("the summary lists each saved place as a selectable row with its own add-to-day button", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks());
  const html = render(store, React.createElement(MyListSummary));
  assert.match(html, /Select all 2 places/);
  assert.match(html, /aria-label="Select Grand Palace"/);
  assert.match(html, /aria-label="Add Wat Pho to a day"/);
  assert.match(html, /In Day 1/, "a place already scheduled says where");
  assert.doesNotMatch(html, /Bring a scarf/, "Before you go is not a saved place");
});

test("a shared plan's summary shows the places without selection or add controls", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks());
  store.set(plannerReadOnlyAtom, true);
  const html = render(store, React.createElement(MyListSummary));
  assert.match(html, /Grand Palace/);
  assert.match(html, /2 saved places/);
  assert.doesNotMatch(html, /Select Grand Palace|Add Wat Pho to a day|Select all/);
});

test("adding several places to a day adds the missing ones and reports those already there", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks());
  const result = store.set(scheduleSavedPlacesAtom, { placeIds: ["palace", "temple"], dayId: "d1" });
  assert.deepEqual(result, { added: 1, skipped: 1 });
  const day = store.get(tripBlocksAtom).find((block) => block.id === "d1");
  assert.deepEqual(day.items.map((item) => item.name), ["Grand Palace", "Wat Pho"]);
  const list = store.get(tripBlocksAtom).find((block) => block.id === "ideas");
  assert.equal(list.items.length, 2, "the saved copies stay in the list");
});

test("a day is only marked as holding a selection when it holds every selected place", () => {
  const [day] = getDayDestinations(blocks(), [palace, temple]);
  assert.equal(day.contains, false);
  assert.equal(getDayDestinations(blocks(), [palace])[0].contains, true);
  assert.equal(getDayDestinations(blocks(), [])[0].contains, false);
});

test("Before you go is a section the owner can start, and stays out of a shared plan that has none", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks().slice(1));
  const owner = render(store, React.createElement(BeforeYouGoSection));
  assert.match(owner, /aria-expanded="true"/);
  assert.match(owner, /Add note/);
  store.set(plannerReadOnlyAtom, true);
  assert.equal(render(store, React.createElement(BeforeYouGoSection)), "");
});

test("the owner writes Before you go in an open section; a reader sees the note without editing controls", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks());
  const owner = render(store, React.createElement(BeforeYouGoSection));
  assert.match(owner, /aria-expanded="true"/);
  assert.match(owner, /Readers see this first/);
  assert.match(owner, /aria-label="Remove Before you go"/);
  assert.doesNotMatch(owner, /data-slot="card"/, "the note sits in the section, not a bordered card");
  store.set(plannerReadOnlyAtom, true);
  const reader = render(store, React.createElement(BeforeYouGoSection));
  assert.match(reader, /Bring a scarf for the temples/);
  assert.doesNotMatch(reader, /Remove Before you go|Add note|Readers see this first/);
});

test("the shared reader opens with the owner's note, credited to them", () => {
  const html = renderToStaticMarkup(React.createElement(ReaderIntroduction, {
    title: "Before you go", authorName: "Mali", value: "Bring a scarf for the temples.",
  }));
  assert.match(html, /id="reader-starting-part"/);
  assert.match(html, /<h2 id="reader-starting-part-title"[^>]*>Before you go<\/h2>/);
  assert.match(html, /A note from Mali/);
  assert.match(html, /Bring a scarf for the temples/);
});
