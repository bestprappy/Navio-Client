import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Only real file extensions count: "trip-route.helpers" and "trip-route.types" are module names.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { automaticLegTravelMode, resolveLegTravelMode, isTransitStation, isRailStation } = await import("../../app/feature/planner/planId/_components/routes/leg-travel-mode.ts");
const { enforceRailOnlyRoutes, getTripRouteGroups, getTripRouteSignature, isRouteSegmentsResponse, safeLineColor } = await import("../../app/feature/planner/planId/_components/routes/trip-route.helpers.ts");
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
  assert.equal(group.points[1].railOnly, true);

  const [driving] = getTripRouteGroups([day([airport, { ...taipei, arrivalMode: "drive" }])]);
  assert.equal(driving.points[1].arrivalMode, undefined);
  assert.equal(driving.points[1].railOnly, undefined);
  assert.notEqual(getTripRouteSignature([group]), getTripRouteSignature([driving]));
});

test("rail station types and legacy labels require rail, while generic transit stops do not", () => {
  for (const placeType of ["subway_station", "train_station", "light_rail_station", "SUBWAY_STATION"]) {
    assert.equal(isRailStation({ placeType }), true);
  }
  for (const description of ["Subway Station", "Train Station", "MRT Station", "BTS Station", "Light Rail Station"]) {
    assert.equal(isRailStation({ description }), true);
  }
  for (const point of [undefined, { placeType: "transit_station" }, { placeType: "bus_station", description: "Bus Station" }, { description: "Transit Station" }]) {
    assert.equal(isRailStation(point), false);
  }
});

test("station return visits require rail in both directions, and mode overrides stay independent", () => {
  const airport = station("airport", { placeType: "subway_station" });
  const taipei = station("taipei", { placeType: "subway_station", lat: 25.04 });
  const [group] = getTripRouteGroups([day([airport, taipei, { ...airport, id: "airport-return" }])]);
  assert.deepEqual(group.points.map(point => [point.arrivalMode, point.railOnly]), [
    [undefined, undefined], ["transit", true], ["transit", true],
  ]);
  for (const arrivalMode of ["drive", "walk"]) {
    const [override] = getTripRouteGroups([day([airport, { ...taipei, arrivalMode }])]);
    assert.equal(override.points[1].railOnly, undefined);
  }
});

test("general transit overrides and bus/transit stops do not acquire the rail restriction", () => {
  const [manual] = getTripRouteGroups([day([
    station("museum", { placeType: "museum" }),
    station("park", { placeType: "park", arrivalMode: "transit" }),
  ])]);
  assert.equal(manual.points[1].arrivalMode, "transit");
  assert.equal(manual.points[1].railOnly, undefined);
  const [generic] = getTripRouteGroups([day([
    station("generic", { placeType: "transit_station" }),
    station("subway", { placeType: "subway_station" }),
  ])]);
  assert.equal(generic.points[1].arrivalMode, "transit");
  assert.equal(generic.points[1].railOnly, undefined);
  const [explicitTransit] = getTripRouteGroups([day([
    station("bts-a", { placeType: "subway_station" }),
    station("bts-b", { placeType: "subway_station", arrivalMode: "transit" }),
  ])]);
  assert.equal(explicitTransit.points[1].arrivalMode, "transit");
  assert.equal(explicitTransit.points[1].railOnly, undefined);
});

test("switching a station's classification invalidates a previously cached bus-capable transit route", () => {
  const airport = station("airport", { placeType: "subway_station" });
  const taipei = station("taipei", { placeType: "subway_station" });
  const railGroups = getTripRouteGroups([day([airport, taipei])]);
  const generalGroups = getTripRouteGroups([day([airport, { ...taipei, placeType: "transit_station" }])]);
  assert.notEqual(getTripRouteSignature(railGroups), getTripRouteSignature(generalGroups));
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

test("a rail leg rejects a bus or bus transfer from an older backend and removes its road geometry", () => {
  const groups = getTripRouteGroups([day([
    station("airport", { placeType: "subway_station", lat: 25.07, lng: 121.2 }),
    station("taipei", { placeType: "subway_station", lat: 25.04, lng: 121.5 }),
  ])]);
  const busRide = { ...transitSegment.steps[0], line: { name: "1819", vehicleType: "BUS" } };
  for (const steps of [[busRide], [...transitSegment.steps, busRide], [], [{ ...busRide, line: null }],
    [...transitSegment.steps, { ...busRide, travelMode: "drive" }]]) {
    const [segment] = enforceRailOnlyRoutes({ groups }, {
      segments: [{ ...transitSegment, steps, geometry: { type: "LineString", coordinates: [[1, 1], [2, 2]] } }],
    }).segments;
    assert.equal(segment.status, "fallback");
    assert.equal(segment.fallbackReason, "No rail route was found");
    assert.equal(segment.durationSeconds, null);
    assert.equal(segment.distanceMeters, null);
    assert.deepEqual(segment.steps, []);
    assert.deepEqual(segment.geometry.coordinates, [[121.2, 25.07], [121.5, 25.04]]);
    assert.equal(isRouteSegmentsResponse({ segments: [segment] }), true);
  }
});

test("rail response enforcement preserves MRT colour/geometry and general-transit buses", () => {
  const groups = getTripRouteGroups([day([
    station("airport", { placeType: "subway_station" }),
    station("taipei", { placeType: "subway_station" }),
  ])]);
  assert.equal(enforceRailOnlyRoutes({ groups }, { segments: [transitSegment] }).segments[0], transitSegment);
  const bus = { ...transitSegment, steps: [{ ...transitSegment.steps[0], line: { name: "1819", vehicleType: "BUS" } }] };
  const general = [{ ...groups[0], points: groups[0].points.map(({ railOnly, ...point }) => point) }];
  assert.equal(enforceRailOnlyRoutes({ groups: general }, { segments: [bus] }).segments[0], bus);
  const otherDay = { ...bus, blockId: "another-day" };
  assert.equal(enforceRailOnlyRoutes({ groups }, { segments: [otherDay] }).segments[0], otherDay);
});

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
