import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });

const { createStore } = await import("jotai");
const { airportToTaipei, allSegments, beitouToTamsui, taipeiToXimen, taipeiView, ximenToHotel } = await import("./route-focus/data.ts");
const {
  getFocusedRouteSegment,
  getRouteBounds,
  getVisibleRoutes,
  isVisitOnSegment,
  shouldFitRouteBounds,
} = await import("../../app/feature/planner/planId/_components/routes/route-focus.ts");
const { getRouteDrawPieces } = await import("../../app/feature/planner/planId/_components/routes/route-draw.ts");
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");

const dayColors = new Map([["day-1", "#0f766e"], ["day-2", "#8246af"]]);

test("a stop card stands for the leg arriving at it", () => {
  assert.equal(getFocusedRouteSegment(allSegments, "ximen"), taipeiToXimen);
  assert.equal(getFocusedRouteSegment(allSegments, "day-1:end"), ximenToHotel);
});

test("a day's start anchor stands for the leg leaving it", () => {
  assert.equal(getFocusedRouteSegment(allSegments, "day-1:start"), airportToTaipei);
});

test("a day's first place without a start anchor stands for the leg leaving it", () => {
  assert.equal(getFocusedRouteSegment(allSegments, "beitou"), beitouToTamsui);
});

test("an unknown or missing stop focuses no leg", () => {
  assert.equal(getFocusedRouteSegment(allSegments, "deleted-stop"), null);
  assert.equal(getFocusedRouteSegment(allSegments, null), null);
});

test("all mode draws every day with no focused leg", () => {
  const visible = getVisibleRoutes(allSegments, "all", "day-1", "ximen");
  assert.equal(visible.segments.length, 4);
  assert.equal(visible.focusedSegment, null);
  assert.equal(visible.hasScope, true);
});

test("day mode draws only the active day and ignores the focused stop", () => {
  const visible = getVisibleRoutes(allSegments, "day", "day-1", "tamsui");
  assert.deepEqual(visible.segments.map((segment) => segment.id), ["seg-1", "seg-2", "seg-3"]);
  assert.equal(visible.focusedSegment, null);
});

test("place mode draws the focused leg's whole day even when another day is active", () => {
  const visible = getVisibleRoutes(allSegments, "stop", "day-1", "tamsui");
  assert.equal(visible.focusedSegment, beitouToTamsui);
  assert.deepEqual(visible.segments.map((segment) => segment.id), ["seg-4"]);
});

test("place mode falls back to the active day until a leg is focused", () => {
  const visible = getVisibleRoutes(allSegments, "stop", "day-1", null);
  assert.equal(visible.focusedSegment, null);
  assert.deepEqual(visible.segments.map((segment) => segment.id), ["seg-1", "seg-2", "seg-3"]);
});

test("nothing is in scope before a day is active", () => {
  const visible = getVisibleRoutes(allSegments, "day", null, null);
  assert.deepEqual(visible.segments, []);
  assert.equal(visible.hasScope, false);
});

test("a focused leg fades the rest of its day and draws on top", () => {
  const pieces = getRouteDrawPieces([airportToTaipei, taipeiToXimen, ximenToHotel], dayColors, "#000000", "seg-2");
  assert.deepEqual(pieces.map((piece) => [piece.id, piece.muted]), [["seg-1", true], ["seg-3", true], ["seg-2", false]]);
});

test("without a focused leg nothing is faded and the order is kept", () => {
  const pieces = getRouteDrawPieces([airportToTaipei, taipeiToXimen], dayColors, "#000000");
  assert.deepEqual(pieces.map((piece) => [piece.id, piece.muted]), [["seg-1", false], ["seg-2", false]]);
});

test("both ends of the focused leg are recognised, including day anchors", () => {
  assert.equal(isVisitOnSegment({ blockId: "day-1", edge: "start" }, airportToTaipei), true);
  assert.equal(isVisitOnSegment({ blockId: "day-1", edge: "stop", itemId: "taipei-main" }, airportToTaipei), true);
  assert.equal(isVisitOnSegment({ blockId: "day-1", edge: "stop", itemId: "ximen" }, airportToTaipei), false);
  assert.equal(isVisitOnSegment({ blockId: "day-2", edge: "start" }, airportToTaipei), false);
});

test("a leg's bounds cover every point and skip broken coordinates", () => {
  assert.deepEqual(getRouteBounds(airportToTaipei.geometry.coordinates), { west: 121.23, south: 25.03, east: 121.517, north: 25.08 });
  assert.deepEqual(getRouteBounds([[Number.NaN, 25], [121.5, 25.04]]), { west: 121.5, south: 25.04, east: 121.5, north: 25.04 });
  assert.equal(getRouteBounds([]), null);
});

test("the camera stays put while a readable leg is already on screen", () => {
  assert.equal(shouldFitRouteBounds(getRouteBounds(airportToTaipei.geometry.coordinates), taipeiView), false);
});

test("the camera moves to a leg that is partly off screen", () => {
  const southOfView = { west: 121.3, south: 24.8, east: 121.4, north: 25.0 };
  assert.equal(shouldFitRouteBounds(southOfView, taipeiView), true);
});

test("the camera zooms to a leg on screen that is too small to make out", () => {
  assert.equal(shouldFitRouteBounds(getRouteBounds(taipeiToXimen.geometry.coordinates), taipeiView), true);
});

test("the camera moves when the map cannot report its view", () => {
  assert.equal(shouldFitRouteBounds(getRouteBounds(airportToTaipei.geometry.coordinates), null), true);
});

test("picking a leg from its travel row switches to place mode and focuses its day", () => {
  const store = createStore();
  store.set(atoms.focusRouteLegAtom, { blockId: "day-2", stopId: "tamsui" });
  assert.equal(store.get(atoms.routeLineModeAtom), "stop");
  assert.equal(store.get(atoms.activeBlockIdAtom), "day-2");
  assert.equal(store.get(atoms.focusedRouteStopIdAtom), "tamsui");
});

test("changing route mode clears the focused stop so scrolling picks it again", () => {
  const store = createStore();
  store.set(atoms.focusRouteLegAtom, { blockId: "day-1", stopId: "ximen" });
  store.set(atoms.setRouteLineModeAtom, "day");
  assert.equal(store.get(atoms.routeLineModeAtom), "day");
  assert.equal(store.get(atoms.focusedRouteStopIdAtom), null);
});
