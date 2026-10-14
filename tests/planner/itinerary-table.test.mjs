import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

const clientRoot = pathToFileURL(`${process.cwd()}/`).href;
registerHooks({ resolve(specifier, context, next) {
  const aliased = specifier.startsWith("@/") ? new URL(specifier.slice(2), clientRoot).href : specifier;
  const local = aliased.startsWith(".") || aliased.startsWith("file:");
  return next(local && !/\.(?:[cm]?js|tsx?|json)$/.test(aliased) ? `${aliased}.ts` : aliased, context);
} });

const itineraryDir = "../../app/feature/planner/planId/_components/itinerary";
const { getArrivalLegs, summarizeDayTravel, getLateArrivals, getStayMinutes, formatMinutes } = await import(`${itineraryDir}/table/itinerary-table-legs.ts`);
const { normalizeHandoutOptions, DEFAULT_HANDOUT_OPTIONS } = await import(`${itineraryDir}/handout/handout-options.ts`);
const { getNotePlainText } = await import("../../components/block-editor/note-plain-text.ts");

const line = { type: "LineString", coordinates: [[0, 0], [1, 1]] };
const segment = (toItemId, overrides = {}) => ({
  id: `to-${toItemId}`, blockId: "day", fromItemId: "x", toItemId, fromName: "A", toName: "B",
  status: "routed", geometry: line, distanceMeters: 1200, durationSeconds: 600, ...overrides,
});

test("each stop gets the leg arriving at it, and older responses without a mode count as driving", () => {
  const legs = getArrivalLegs([segment("a"), segment("b", { travelMode: "walk", durationSeconds: 300 })]);
  assert.deepEqual(legs.get("a"), { mode: "drive", status: "routed", durationSeconds: 600, distanceMeters: 1200, rides: [], walkingSeconds: null, savedRouteUnavailable: false });
  assert.equal(legs.get("b").mode, "walk");
});

test("a fallback leg is unverified and never shows a travel time", () => {
  const legs = getArrivalLegs([segment("a", { status: "fallback", travelMode: "transit", durationSeconds: 900 })]);
  assert.deepEqual(legs.get("a"), { mode: "transit", status: "unverified", durationSeconds: null, distanceMeters: 1200, rides: [], walkingSeconds: null, savedRouteUnavailable: false });
});

test("missing or non-positive durations and distances are treated as unknown", () => {
  const legs = getArrivalLegs([segment("a", { durationSeconds: null, distanceMeters: 0 })]);
  assert.deepEqual(legs.get("a"), { mode: "drive", status: "routed", durationSeconds: null, distanceMeters: null, rides: [], walkingSeconds: null, savedRouteUnavailable: false });
});

test("a transit leg lists its rides in order with where to board and get off, and adds up the walking", () => {
  const walk = (seconds) => ({ travelMode: "walk", geometry: line, durationSeconds: seconds });
  const legs = getArrivalLegs([segment("a", {
    travelMode: "transit",
    savedRouteUnavailable: true,
    steps: [
      walk(540),
      { travelMode: "transit", geometry: line, line: { name: "23 REG : Samrong - Thewet", shortName: "23 REG", color: "#0A9F3B", vehicleType: "BUS" }, departureStop: " Mu Ban Nakhon Thong ", arrivalStop: "Kon Yaek Lasalle", stopCount: 13, headsign: "Thewet" },
      walk(180),
      { travelMode: "transit", geometry: line, line: { name: "Blue Line", color: "blue", vehicleType: "SUBWAY" }, departureStop: "Bang Wa", arrivalStop: null, stopCount: 0 },
    ],
  })]);
  const leg = legs.get("a");
  assert.equal(leg.walkingSeconds, 720);
  assert.equal(leg.savedRouteUnavailable, true);
  assert.deepEqual(leg.rides, [
    { line: "23 REG", vehicle: "Bus", color: "#0A9F3B", from: "Mu Ban Nakhon Thong", to: "Kon Yaek Lasalle", stopCount: 13, headsign: "Thewet" },
    { line: "Blue Line", vehicle: "Metro", color: null, from: "Bang Wa", to: null, stopCount: null, headsign: null },
  ]);
});

test("a fallback transit leg keeps no rides, since they were never confirmed", () => {
  const legs = getArrivalLegs([segment("a", { status: "fallback", travelMode: "transit", steps: [{ travelMode: "transit", geometry: line, line: { name: "Blue Line" } }] })]);
  assert.deepEqual(legs.get("a").rides, []);
});

test("a day's travel adds up by mode, longest first, and counts unverified legs separately", () => {
  const summary = summarizeDayTravel([
    undefined,
    { mode: "drive", status: "routed", durationSeconds: 600, distanceMeters: null },
    { mode: "walk", status: "routed", durationSeconds: 1200, distanceMeters: null },
    { mode: "drive", status: "routed", durationSeconds: 1200, distanceMeters: null },
    { mode: "transit", status: "unverified", durationSeconds: null, distanceMeters: 500 },
  ]);
  assert.equal(summary.totalSeconds, 3000);
  assert.deepEqual(summary.modes.map(({ mode, seconds, share }) => [mode, seconds, share]), [
    ["drive", 1800, 0.6],
    ["walk", 1200, 0.4],
  ]);
  assert.equal(summary.unverifiedCount, 1);
});

test("a day with no routed legs has no travel and no modes", () => {
  assert.deepEqual(summarizeDayTravel([undefined]), { totalSeconds: 0, modes: [], unverifiedCount: 0 });
});

const leg = (minutes, status = "routed") => ({ mode: "drive", status, durationSeconds: minutes * 60, distanceMeters: null, rides: [], walkingSeconds: null, savedRouteUnavailable: false });
const row = (id, startMinute, endMinute = null) => ({ id, startMinute, endMinute });

test("a stop is late when the stop before ends too close to it for the routed travel time", () => {
  const rows = [row("a", 540, 600), row("b", 620, 680), row("c", 700)];
  const late = getLateArrivals(rows, new Map([["b", leg(30)], ["c", leg(20)]]));
  assert.deepEqual([...late], [["b", 10]]);
});

test("travel that arrives exactly on time is not late, and partial seconds round up to a minute", () => {
  const rows = [row("a", 540, 600), row("b", 630)];
  assert.equal(getLateArrivals(rows, new Map([["b", leg(30)]])).size, 0);
  assert.deepEqual([...getLateArrivals(rows, new Map([["b", { ...leg(30), durationSeconds: 1801 }]]))], [["b", 1]]);
});

test("lateness is not guessed without both times or a routed leg", () => {
  const legs = new Map([["b", leg(90)], ["d", leg(90, "unverified")]]);
  assert.equal(getLateArrivals([row("a", null), row("b", 540)], legs).size, 0, "no time before");
  assert.equal(getLateArrivals([row("a", 540), row("b", null)], legs).size, 0, "no time here");
  assert.equal(getLateArrivals([row("c", 540), row("d", 560)], legs).size, 0, "unconfirmed route");
});

test("a stop without an end time is left from its start", () => {
  assert.deepEqual([...getLateArrivals([row("a", 540), row("b", 560)], new Map([["b", leg(30)]]))], [["b", 10]]);
});

test("a stay lasts from start to end, and is unknown without both or when the end is not after the start", () => {
  assert.equal(getStayMinutes(row("a", 540, 615)), 75);
  assert.equal(getStayMinutes(row("a", 540)), null);
  assert.equal(getStayMinutes(row("a", 600, 540)), null);
  assert.deepEqual([45, 60, 75].map(formatMinutes), ["45 min", "1 hr", "1 hr 15 min"]);
});

test("note markdown becomes one line of sentences for the table", () => {
  const markdown = "## Before you go\n\n- **Cover** shoulders\n- [ ] Bring cash!\n\nSee [the map](https://example.test)";
  assert.equal(getNotePlainText(markdown), "Before you go. Cover shoulders. Bring cash! See the map");
  assert.equal(getNotePlainText("Line one\nline two"), "Line one line two");
  assert.equal(getNotePlainText("7:30 AM เอากระเป๋า"), "7:30 AM เอากระเป๋า");
  assert.equal(getNotePlainText("   "), "");
});

test("stored handout options fall back to defaults for anything missing or malformed", () => {
  assert.deepEqual(normalizeHandoutOptions(null), DEFAULT_HANDOUT_OPTIONS);
  assert.deepEqual(normalizeHandoutOptions({ preparedBy: "Siam Tours", showCosts: true, showNotes: "yes" }), {
    ...DEFAULT_HANDOUT_OPTIONS,
    preparedBy: "Siam Tours",
    showCosts: true,
  });
  assert.equal(normalizeHandoutOptions({ preparedBy: "x".repeat(300) }).preparedBy.length, 120);
});
