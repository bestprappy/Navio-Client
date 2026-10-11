import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Only real file extensions count: "trip-route.helpers" and "trip-route.types" are module names.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { automaticLegTravelMode, resolveLegTravelMode, isTransitStation } = await import("../../app/feature/planner/planId/_components/routes/leg-travel-mode.ts");
const { getTripRouteGroups, getTripRouteSignature, isRouteSegmentsResponse, safeLineColor } = await import("../../app/feature/planner/planId/_components/routes/trip-route.helpers.ts");
const { getRouteDrawPieces } = await import("../../app/feature/planner/planId/_components/routes/route-draw.ts");
const { projectCanonicalTrip } = await import("../../app/feature/planner/planId/_components/garage/trip-energy-projection.ts");

const station = (id, extra = {}) => ({ id, type: "place", placeId: id, name: id, address: "", lat: 25, lng: 121, ...extra });
const day = (items, extra = {}) => ({ id: "day-1", kind: "itinerary", title: "Day 1", date: "2026-10-12", colorId: "teal", items, ...extra });

test("a leg between two stations is automatically public transit", () => {
  assert.equal(automaticLegTravelMode({ placeType: "subway_station" }, { placeType: "train_station" }), "transit");
});

test("stops saved before the place type was kept are recognised by their station label", () => {
  assert.equal(isTransitStation({ description: "Subway Station" }), true);
  assert.equal(isTransitStation({ description: "Gas Station" }), false);
});

test("a leg from a day anchor drives, because anchors are never stations", () => {
  assert.equal(resolveLegTravelMode(undefined, { placeType: "subway_station" }), "drive");
});

test("the traveller's choice overrides the automatic mode", () => {
  assert.equal(resolveLegTravelMode({ placeType: "subway_station" }, { placeType: "subway_station", arrivalMode: "drive" }), "drive");
  assert.equal(resolveLegTravelMode({ placeType: "museum" }, { placeType: "park", arrivalMode: "walk" }), "walk");
});

test("route groups send only non-driving modes and key the cache on them", () => {
  const airport = station("airport", { placeType: "subway_station" });
  const taipei = station("taipei", { description: "Subway Station", lat: 25.04 });
  const [group] = getTripRouteGroups([day([airport, taipei])]);
  assert.equal(group.points[0].arrivalMode, undefined);
  assert.equal(group.points[1].arrivalMode, "transit");

  const [driving] = getTripRouteGroups([day([airport, { ...taipei, arrivalMode: "drive" }])]);
  assert.equal(driving.points[1].arrivalMode, undefined);
  assert.notEqual(getTripRouteSignature([group]), getTripRouteSignature([driving]));
});

const transitSegment = {
  id: "s1", blockId: "day-1", fromItemId: "airport", toItemId: "taipei", fromName: "A", toName: "B",
  status: "routed", geometry: { type: "LineString", coordinates: [[121.2, 25.07], [121.5, 25.04]] },
  distanceMeters: 40100, durationSeconds: 2880, fallbackReason: null, travelMode: "transit",
  steps: [
    { travelMode: "transit", geometry: { type: "LineString", coordinates: [[121.2, 25.07], [121.4, 25.05]] },
      distanceMeters: 39000, durationSeconds: 2280, departureStop: "A", arrivalStop: "B", stopCount: 5,
      line: { name: "Airport MRT", shortName: "A", color: "#8246af", textColor: "#ffffff", vehicleType: "SUBWAY" } },
    { travelMode: "walk", geometry: { type: "LineString", coordinates: [[121.4, 25.05], [121.5, 25.04]] },
      distanceMeters: 1100, durationSeconds: 600, line: null },
  ],
};

test("transit segments with ride and walk steps pass response validation", () => {
  assert.equal(isRouteSegmentsResponse({ segments: [transitSegment] }), true);
});

test("a segment with an unknown travel mode is rejected as malformed", () => {
  assert.equal(isRouteSegmentsResponse({ segments: [{ ...transitSegment, travelMode: "teleport" }] }), false);
});

test("segments from an older mobility release without a mode still validate", () => {
  const legacy = { ...transitSegment };
  delete legacy.travelMode;
  delete legacy.steps;
  assert.equal(isRouteSegmentsResponse({ segments: [legacy] }), true);
});

test("a ride is drawn in its line colour and the walk after it dotted in the day colour", () => {
  const pieces = getRouteDrawPieces([transitSegment], new Map([["day-1", "#0f766e"]]), "#000000");
  assert.deepEqual(pieces.map(piece => [piece.kind, piece.color]), [["ride", "#8246af"], ["walk", "#0f766e"]]);
});

test("a line colour that is not plain hex falls back instead of reaching a style", () => {
  assert.equal(safeLineColor("red;background:url(x)"), null);
  const unsafe = { ...transitSegment, steps: [{ ...transitSegment.steps[0], line: { color: "url(x)" } }] };
  assert.equal(getRouteDrawPieces([unsafe], new Map([["day-1", "#0f766e"]]), "#000000")[0].color, "#0f766e");
});

test("a transit leg costs the car battery nothing", () => {
  const car = { connectorTypes: ["CCS2"], energyProfile: { modelKind: "RATED_RANGE", ratedRangeKm: 400, consumptionKwhPer100km: null, usableBatteryCapacityKwh: null } };
  const blocks = [day([station("airport", { placeType: "subway_station" }), station("taipei", { placeType: "subway_station", lat: 25.04 })])];
  const { days, summary } = projectCanonicalTrip(blocks, [transitSegment], car, 80);
  assert.equal(summary.totalDistanceKm, 0);
  assert.equal(days.get("day-1").batteryByItemId.get("taipei").arrivalPct, 80);
});
