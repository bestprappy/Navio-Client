import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createStore, Provider } from "jotai";

register(new URL("../support/typescript-loader.mjs", import.meta.url));

const { dayViewBlocks } = await import("./itinerary-day-view/data.ts");
const { tripBlocksAtom, activeBlockIdAtom, openBlockIdsAtom } = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { itineraryDayViewAtom, selectedItineraryDayAtom, selectItineraryDayAtom, visibleItineraryDaysAtom } = await import("../../app/feature/planner/planId/_components/itinerary/itinerary-day-view.atoms.ts");
const { ItineraryDayControls } = await import("../../app/feature/planner/planId/_components/itinerary/itinerary-day-controls.tsx");

function plannerStore() {
  const store = createStore();
  store.set(tripBlocksAtom, structuredClone(dayViewBlocks));
  store.set(activeBlockIdAtom, "day-2");
  store.set(openBlockIdsAtom, ["saved-list", "day-1"]);
  return store;
}

test("undated and malformed shared-plan days render in both modes without inventing dates", () => {
  for (const date of ["", "not-a-date", "2026-99-99"]) {
    for (const view of ["all", "single"]) {
      const store = plannerStore();
      store.set(tripBlocksAtom, dayViewBlocks.map(block => block.id === "day-2" ? { ...block, date } : block));
      store.set(itineraryDayViewAtom, view);
      const html = renderToStaticMarkup(createElement(Provider, { store }, createElement(ItineraryDayControls)));
      assert.match(html, /Days shown/);
      assert.doesNotMatch(html, /Invalid Date|NaN/);
      if (view === "single") {
        assert.match(html, /Day 2/);
        assert.match(html, /Date not set/);
      }
      assert.equal(store.get(tripBlocksAtom).find(block => block.id === "day-2")?.date, date);
    }
  }
});

test("defaults to all days; entering one day starts with the active itinerary day", () => {
  const store = plannerStore();
  assert.equal(store.get(itineraryDayViewAtom), "all");
  assert.deepEqual(store.get(visibleItineraryDaysAtom).map(({ block }) => block.id), ["day-1", "day-2", "day-3"]);
  store.set(itineraryDayViewAtom, "single");
  assert.equal(store.get(selectedItineraryDayAtom)?.id, "day-2");
  assert.deepEqual(store.get(visibleItineraryDaysAtom).map(({ block, index }) => [block.id, index]), [["day-2", 1]]);
});

test("switching days and modes preserves full trip data and all-days expansion state", () => {
  const store = plannerStore();
  const originalBlocks = store.get(tripBlocksAtom);
  const originalOpenIds = store.get(openBlockIdsAtom);
  store.set(itineraryDayViewAtom, "single");
  store.set(selectItineraryDayAtom, "day-3");
  assert.equal(store.get(selectedItineraryDayAtom)?.id, "day-3");
  assert.deepEqual(store.get(visibleItineraryDaysAtom).map(({ block, index }) => [block.id, index]), [["day-3", 2]]);
  assert.equal(store.get(activeBlockIdAtom), "day-3");
  store.set(itineraryDayViewAtom, "all");
  assert.equal(store.get(tripBlocksAtom), originalBlocks);
  assert.equal(store.get(openBlockIdsAtom), originalOpenIds);
});

test("scrolling to a list or another block does not replace the single-day selection", () => {
  const store = plannerStore();
  store.set(itineraryDayViewAtom, "single");
  store.set(activeBlockIdAtom, "saved-list");
  assert.equal(store.get(selectedItineraryDayAtom)?.id, "day-2");
  store.set(activeBlockIdAtom, "day-1");
  assert.equal(store.get(selectedItineraryDayAtom)?.id, "day-2");
});

test("list and stale IDs cannot be selected as itinerary days", () => {
  const store = plannerStore();
  store.set(itineraryDayViewAtom, "single");
  for (const id of ["saved-list", "deleted-day"]) store.set(selectItineraryDayAtom, id);
  assert.equal(store.get(selectedItineraryDayAtom)?.id, "day-2");
  assert.equal(store.get(activeBlockIdAtom), "day-2");
});

test("removing the selected day or loading another trip falls back to a valid day", () => {
  const store = plannerStore();
  store.set(itineraryDayViewAtom, "single");
  store.set(tripBlocksAtom, dayViewBlocks.filter((block) => block.id !== "day-2"));
  assert.equal(store.get(selectedItineraryDayAtom)?.id, "day-1");
  store.set(tripBlocksAtom, [{ ...dayViewBlocks[3], id: "other-trip-day" }]);
  assert.equal(store.get(selectedItineraryDayAtom)?.id, "other-trip-day");
  store.set(tripBlocksAtom, []);
  assert.equal(store.get(selectedItineraryDayAtom), null);
});

test("options-menu day picker keeps original day numbering and dates", () => {
  const store = plannerStore();
  store.set(itineraryDayViewAtom, "single");
  store.set(selectItineraryDayAtom, "day-3");
  const html = renderToStaticMarkup(createElement(Provider, { store }, createElement(ItineraryDayControls)));
  const checked = [...html.matchAll(/<button[^>]*aria-checked="true"[^>]*>([\s\S]*?)<\/button>/g)].map(([, inner]) => inner);
  assert.equal(checked.length, 2, "one view radio and one day radio are checked");
  assert.match(checked[0], /One day/);
  assert.match(checked[1], /Day 3/);
  assert.match(checked[1], /Oct 23/);
  assert.equal(html.match(/role="radio"/g)?.length, 2 + 3, "two view options plus one row per itinerary day");
  assert.doesNotMatch(html, /My places/);
});

test("all-days mode hides the day list", () => {
  const store = plannerStore();
  const html = renderToStaticMarkup(createElement(Provider, { store }, createElement(ItineraryDayControls)));
  assert.match(html, /aria-checked="true"[^>]*>All days</);
  assert.doesNotMatch(html, /Day to show/);
});
