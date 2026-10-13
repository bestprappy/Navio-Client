import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { origin, destination, journeyDay, railRoute, scheduledJourneys } = await import("./travel-options/data.ts");
const { getTravelOptionRequests, combineTransitOptions, getTravelOptionPreview, isUsableTravelOption, getTransitSummary, getTransitVehicleLabel, getLegDirectionsUrl, getLineTextColor } = await import("../../app/feature/planner/planId/_components/routes/travel-options.ts");
const { getTripRouteGroups, isRouteSegmentsResponse } = await import("../../app/feature/planner/planId/_components/routes/trip-route.helpers.ts");
const { projectCanonicalTrip } = await import("../../app/feature/planner/planId/_components/garage/trip-energy-projection.ts");
const { createStore } = await import("jotai");
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { savePlannerSnapshot, getPlannerSnapshot } = await import("../../app/feature/planner/_components/planner-api.ts");
const { addWalkFinishAlternatives } = await import("../../app/feature/planner/planId/_components/routes/transit-walk-alternatives.ts");
const { getTransitRouteKey, rankTransitJourneys, applySavedTransitRoutes } = await import("../../app/feature/planner/planId/_components/routes/transit-route-choice.ts");
const { getWalkInstruction, getTransitStopMarkers, formatTransitClock, formatTransitFare, journeyAsSegment } = await import("../../app/feature/planner/planId/_components/routes/transit-journey.helpers.ts");

test("walking directions name the next station, bus stop and final destination", () => {
  assert.equal(getWalkInstruction(railRoute.steps, 0), "Walk to Victory Monument Station");
  const bus = [{ travelMode: "walk" }, { travelMode: "transit", departureStop: "Main Street", line: { vehicleType: "BUS" } }];
  assert.equal(getWalkInstruction(bus, 0), "Walk to Main Street bus stop");
  assert.equal(getWalkInstruction([...railRoute.steps, { travelMode: "walk" }], 3, "Theatre"), "Walk to Theatre");
});

test("map markers use actual provider stops and identify a same-location transfer", () => {
  const markers = getTransitStopMarkers([{ ...railRoute, steps: scheduledJourneys[0].steps }]);
  assert.deepEqual(markers.map(marker => [marker.name, marker.role]), [["Victory Monument", "Board"], ["Siam", "Transfer"], ["Ratchadamri", "Get off"]]);
  assert.deepEqual(markers[0].coordinate, [100.538, 13.763]);
  assert.deepEqual(getTransitStopMarkers([railRoute]), [], "Legacy geometry does not pretend to be an exact station location");
  assert.deepEqual(getTransitStopMarkers([{ ...railRoute, status: "fallback", steps: scheduledJourneys[0].steps }]), []);
});

test("schedule clocks use the operator timezone and missing fares remain unknown", () => {
  assert.equal(formatTransitClock("2026-10-13T20:05:00Z", "Asia/Tokyo"), "05:05");
  assert.equal(formatTransitClock("not-a-date", "Asia/Tokyo"), null);
  assert.equal(formatTransitClock("2026-10-13T20:05:00Z", "not-a-zone"), null);
  assert.ok(formatTransitFare(scheduledJourneys[0]).includes("47"));
  assert.equal(formatTransitFare(scheduledJourneys[1]), null);
});

test("an alternative preview carries its own route, walking parts and durations", () => {
  const preview = journeyAsSegment(scheduledJourneys[1], railRoute);
  assert.deepEqual(preview.geometry, scheduledJourneys[1].geometry);
  assert.equal(preview.durationSeconds, 1500);
  assert.equal(preview.toItemId, destination.id);
  assert.equal(preview.travelMode, "transit");
  assert.equal(preview.status, "routed");
});

test("new transit payloads validate and malformed alternative geometry or coordinates fail closed", () => {
  assert.equal(isRouteSegmentsResponse({ segments: [{ ...railRoute, journeys: scheduledJourneys }] }), true);
  assert.equal(isRouteSegmentsResponse({ segments: [{ ...railRoute, journeys: [{ ...scheduledJourneys[0], geometry: null }] }] }), false);
  assert.equal(isRouteSegmentsResponse({ segments: [{ ...railRoute, journeys: [{ ...scheduledJourneys[0], steps: [{ ...scheduledJourneys[0].steps[1], departureLocation: [999, 900] }] }] }] }), false);
});

test("comparisons use the exact leg and separate automatic rail from general transit", () => {
  const requests = getTravelOptionRequests(journeyDay.id, origin, destination);
  assert.deepEqual(requests.map(option => option.key), ["drive", "transit", "bike", "walk", "rail", "bus", "rail", "bus"]);
  for (const option of requests) {
    assert.equal(option.request.groups.length, 1);
    const [from, to] = option.request.groups[0].points;
    assert.equal(from.arrivalMode, undefined);
    assert.equal(from.railOnly, undefined);
    assert.equal(to.railOnly, option.key === "rail" ? true : undefined);
    assert.equal(to.arrivalMode, option.key);
    assert.deepEqual([from.lat, to.lng], [origin.lat, destination.lng]);
  }
  assert.equal(getTravelOptionRequests(journeyDay.id, { ...origin, name: "Airport" }, { ...destination, name: "Hotel" }).length, 8);
});

test("unknown and direct-line connections never become selectable routes", () => {
  assert.equal(isUsableTravelOption(undefined), false);
  assert.equal(isUsableTravelOption({ key: "transit", segment: null }), false);
  assert.equal(isUsableTravelOption({ key: "transit", segment: { ...railRoute, status: "fallback" } }), false);
  assert.equal(isUsableTravelOption({ key: "bike", segment: { ...railRoute, travelMode: "drive" } }), false);
  assert.equal(isUsableTravelOption({ key: "rail", segment: railRoute }), true);
});

test("operator labels and transfer counts work without naming a particular country", () => {
  assert.equal(getTransitSummary(railRoute), "BTS Sukhumvit Line → BTS Silom Line · 1 transfer");
  assert.equal(getTransitSummary({ ...railRoute, status: "fallback" }), null);
  assert.equal(getTransitVehicleLabel({ line: { vehicleType: "BUS" } }), "Bus");
  assert.equal(getTransitVehicleLabel({ line: { vehicleType: "SUBWAY" } }), "Metro");
  assert.equal(getTransitVehicleLabel({ line: { vehicleType: "TRAM" } }), "Tram");
  assert.equal(getTransitVehicleLabel({ line: { vehicleType: "FERRY" } }), "Ferry");
});

test("Google Maps links retain the leg and chosen mode, including cycling", () => {
  for (const [mode, expected] of [["drive", "driving"], ["transit", "transit"], ["bike", "bicycling"], ["walk", "walking"]]) {
    const url = new URL(getLegDirectionsUrl(origin, destination, mode));
    assert.equal(url.searchParams.get("origin"), `${origin.lat},${origin.lng}`);
    assert.equal(url.searchParams.get("destination"), `${destination.lat},${destination.lng}`);
    assert.equal(url.searchParams.get("travelmode"), expected);
  }
});

test("published line badges retain readable ink on both light and dark line colours", () => {
  assert.equal(getLineTextColor("#ffffff"), "#000000");
  assert.equal(getLineTextColor("#000"), "#ffffff");
  assert.equal(getLineTextColor("#71BF45"), "#000000");
});

test("a chosen bike leg validates, routes independently, and consumes no car battery", () => {
  const block = { ...journeyDay, items: journeyDay.items.map((item, index) => index ? { ...item, arrivalMode: "bike" } : item) };
  const route = { ...railRoute, travelMode: "bike", steps: [] };
  assert.equal(isRouteSegmentsResponse({ segments: [route] }), true);
  const [group] = getTripRouteGroups([block]);
  assert.equal(group.points[1].arrivalMode, "bike");
  assert.equal(group.points[1].railOnly, undefined);
  const car = { connectorTypes: ["CCS2"], energyProfile: { modelKind: "RATED_RANGE", ratedRangeKm: 400 } };
  const projection = projectCanonicalTrip([block], [route], car, 80);
  assert.equal(projection.summary.totalDistanceKm, 0);
  assert.equal(projection.days.get(block.id).batteryByItemId.get(destination.id).arrivalPct, 80);
});

test("adding a suggested station uses its place identity and preserves both endpoint cards", () => {
  const store = createStore();
  store.set(atoms.tripBlocksAtom, [journeyDay]);
  const id = store.set(atoms.addPlaceVisitToBlockAtom, { blockId: journeyDay.id, beforeItemId: destination.id,
    place: { placeId: "GOOGLE:siam", name: "Siam", address: "Bangkok", lat: 13.745, lng: 100.534, placeType: "subway_station" } });
  store.set(atoms.updatePlaceItemAtom, { blockId: journeyDay.id, itemId: id, updates: { arrivalMode: "transit" } });
  const items = store.get(atoms.tripBlocksAtom)[0].items;
  assert.deepEqual(items.map(item => item.name), [origin.name, "Siam", destination.name]);
  assert.deepEqual(items[0], journeyDay.items[0]);
  assert.deepEqual(items[2], journeyDay.items[1]);
  assert.equal(items[1].placeId, "GOOGLE:siam");
  assert.equal(items[1].arrivalMode, "transit");
  store.set(atoms.plannerReadOnlyAtom, true);
  assert.equal(store.set(atoms.addPlaceVisitToBlockAtom, { blockId: journeyDay.id, beforeItemId: destination.id, place: items[1] }), undefined);
  assert.equal(store.get(atoms.tripBlocksAtom)[0].items.length, 3);
});

test("cycling saves fail before PUT against an older service and round-trip against the new capability", async () => {
  const originalFetch = globalThis.fetch;
  const blocks = [{ ...journeyDay, items: journeyDay.items.map(item => ({ ...item, arrivalMode: "bike" })) }];
  const budget = { currency: "THB", amount: 0, expenses: [] };
  let stored = { blocks, budget, version: 1, savedAt: "2026-10-13T00:00:00Z", capabilities: ["leg-travel-mode-v1"] };
  let writes = 0;
  globalThis.fetch = async (_url, request) => {
    if (request?.method === "PUT") {
      writes++;
      stored = { ...stored, ...JSON.parse(request.body), version: 2 };
      return Response.json({ version: 2, savedAt: stored.savedAt });
    }
    return Response.json(stored);
  };
  try {
    await assert.rejects(savePlannerSnapshot("trip", blocks, budget, 1), /bike journeys/);
    assert.equal(writes, 0);
    stored.capabilities.push("cycling-legs-v1");
    await savePlannerSnapshot("trip", blocks, budget, 1);
    assert.equal(writes, 1);
    assert.equal((await getPlannerSnapshot("trip")).blocks[0].items[1].arrivalMode, "bike");
  } finally { globalThis.fetch = originalFetch; }
});


test("all transit combines and deduplicates rail and bus alternatives even when the general result is only bus", () => {
  const busSteps = [railRoute.steps[0], { ...railRoute.steps[1], line: { name: "1819", vehicleType: "BUS" } }];
  const bus = { ...railRoute, travelMode: "bus", steps: busSteps, journeys: [{ ...scheduledJourneys[0], steps: busSteps }] };
  const rail = { ...railRoute, travelMode: "rail", journeys: scheduledJourneys };
  const result = combineTransitOptions([{ key: "transit", segment: { ...bus, travelMode: "transit" } }, { key: "rail", segment: rail }, { key: "bus", segment: bus }]);
  assert.equal(result[0].segment.journeys.length, 3);
  assert.equal(new Set(result[0].segment.journeys.map(item => item.id)).size, 3);
  assert.ok(result[0].segment.journeys.some(item => item.steps.some(step => step.line?.vehicleType === "BUS")));
  assert.ok(result[0].segment.journeys.some(item => item.steps.some(step => step.line?.name === "BTS Sukhumvit Line")));
  assert.equal(isUsableTravelOption({ key: "rail", segment: bus }), false);
  assert.equal(isUsableTravelOption({ key: "bus", segment: rail }), false);
  const recovered = combineTransitOptions([{ key: "transit", segment: null }, { key: "rail", segment: rail }]);
  assert.equal(isUsableTravelOption(recovered[0]), true);
});

test("every confirmed mode previews its geometry while fallbacks cannot overwrite the map", () => {
  for (const key of ["drive", "bike", "walk", "rail", "bus", "transit"]) {
    const steps = key === "bus" ? [ { ...railRoute.steps[1], line: { name: "Bus 15", vehicleType: "BUS" } } ] : railRoute.steps;
    const segment = { ...railRoute, travelMode: key, steps, geometry: { type: "LineString", coordinates: [[100, 13], [101, 14]] } };
    assert.deepEqual(getTravelOptionPreview({ key, segment }).geometry, segment.geometry);
    assert.equal(getTravelOptionPreview({ key, segment }).travelMode, key);
    assert.equal(getTravelOptionPreview({ key, segment: { ...segment, status: "fallback" } }), null);
  }
  const rail = { ...railRoute, travelMode: "rail", journeys: scheduledJourneys };
  const preview = getTravelOptionPreview({ key: "rail", segment: rail }, scheduledJourneys[1].id);
  assert.deepEqual(preview.geometry, scheduledJourneys[1].geometry);
  assert.equal(preview.travelMode, "rail");
  assert.equal(getTransitStopMarkers([preview])[0].name, "Alternative station");
});

test("rail and bus preferences persist between airport and hotel, without consuming car energy", async () => {
  const originalFetch = globalThis.fetch;
  const budget = { currency: "THB", amount: 0, expenses: [] };
  for (const mode of ["rail", "bus"]) {
    const blocks = [{ ...journeyDay, items: journeyDay.items.map((item, index) => ({ ...item, placeType: index ? "lodging" : "airport", description: "Place", arrivalMode: index ? mode : null })) }];
    let stored = { blocks, budget, version: 1, savedAt: "2026-10-13T00:00:00Z", capabilities: ["leg-travel-mode-v1"] };
    let writes = 0;
    globalThis.fetch = async (_url, request) => {
      if (request?.method === "PUT") { writes++; stored = { ...stored, ...JSON.parse(request.body), version: 2 }; }
      return Response.json(stored);
    };
    try {
      await assert.rejects(savePlannerSnapshot("trip", blocks, budget, 1), /rail or bus preferences/);
      assert.equal(writes, 0);
      stored.capabilities.push("transit-preferences-v1");
      await savePlannerSnapshot("trip", blocks, budget, 1);
      assert.equal(writes, 1);
      const reloaded = (await getPlannerSnapshot("trip")).blocks;
      assert.equal(reloaded[0].items[1].arrivalMode, mode);
      assert.equal(getTripRouteGroups(reloaded)[0].points[1].arrivalMode, mode);
      const car = { connectorTypes: ["CCS2"], energyProfile: { modelKind: "RATED_RANGE", ratedRangeKm: 400 } };
      assert.equal(projectCanonicalTrip(reloaded, [{ ...railRoute, travelMode: mode }], car, 80).summary.totalDistanceKm, 0);
    } finally { globalThis.fetch = originalFetch; }
  }
});


test("balanced ranking compares a short connection with a long final walk", () => {
  const base = scheduledJourneys[0];
  const direct = { ...base, id: "direct", durationSeconds: 3720, walkingSeconds: 1380, steps: [railRoute.steps[0], { ...railRoute.steps[1], arrivalStop: "Taipei Main" }] };
  const ximen = { ...base, id: "ximen", durationSeconds: 3840, walkingSeconds: 1020, steps: [railRoute.steps[0], { ...railRoute.steps[1], arrivalStop: "Taipei Main" }, { ...railRoute.steps[2], departureStop: "Taipei Main", arrivalStop: "Ximen" }] };
  assert.deepEqual(rankTransitJourneys([direct, ximen]).map(item => item.id), ["ximen", "direct"]);
  assert.equal(getTransitRouteKey(ximen.steps), getTransitRouteKey(ximen.steps.map(step => ({ ...step, departureTime: "2026-10-14T04:00:00Z" }))));
  assert.notEqual(getTransitRouteKey(ximen.steps), getTransitRouteKey(direct.steps));
});

test("a saved route restores the chosen geometry and does not silently switch when unavailable", () => {
  const chosen = scheduledJourneys[1];
  const key = getTransitRouteKey(chosen.steps);
  const request = { groups: [{ blockId: railRoute.blockId, points: [origin, { ...destination, arrivalMode: "rail", arrivalRouteKey: key }] }] };
  const response = applySavedTransitRoutes(request, { segments: [{ ...railRoute, travelMode: "rail", journeys: scheduledJourneys }] });
  assert.deepEqual(response.segments[0].geometry, chosen.geometry);
  assert.equal(response.segments[0].travelMode, "rail");
  const missing = applySavedTransitRoutes(request, { segments: [{ ...railRoute, journeys: [scheduledJourneys[0]] }] }).segments[0];
  assert.equal(missing.status, "fallback");
  assert.equal(missing.durationSeconds, null);
  assert.equal(missing.fallbackReason, "Your selected transit route is not available");
});

test("specific route saves require the capability and restore the selected line sequence", async () => {
  const originalFetch = globalThis.fetch;
  const key = getTransitRouteKey(scheduledJourneys[1].steps);
  const blocks = [{ ...journeyDay, items: journeyDay.items.map((item, index) => index ? { ...item, arrivalMode: "rail", arrivalRouteKey: key } : item) }];
  const budget = { currency: "THB", amount: 0, expenses: [] };
  let stored = { blocks, budget, version: 1, savedAt: "2026-10-13T00:00:00Z", capabilities: ["leg-travel-mode-v1", "transit-preferences-v1"] };
  let writes = 0;
  globalThis.fetch = async (_url, request) => {
    if (request?.method === "PUT") { writes++; stored = { ...stored, ...JSON.parse(request.body), version: 2 }; }
    return Response.json(stored);
  };
  try {
    await assert.rejects(savePlannerSnapshot("trip", blocks, budget, 1), /specific transit route/);
    assert.equal(writes, 0);
    stored.capabilities.push("transit-route-choice-v1");
    await savePlannerSnapshot("trip", blocks, budget, 1);
    const reloaded = (await getPlannerSnapshot("trip")).blocks;
    assert.equal(reloaded[0].items[1].arrivalRouteKey, key);
    assert.equal(getTripRouteGroups(reloaded)[0].points[1].arrivalRouteKey, key);
  } finally { globalThis.fetch = originalFetch; }
});


test("a saved direct ride rechecks fewer-transfer alternatives and strips selection metadata from the provider request", async () => {
  const { fetchTripRoutes } = await import("../../app/feature/planner/planId/_components/routes/trip-route-api.ts");
  const originalFetch = globalThis.fetch;
  const chosen = scheduledJourneys[1];
  const key = getTransitRouteKey(chosen.steps);
  const requests = [];
  globalThis.fetch = async (_url, request) => {
    const body = JSON.parse(request.body); requests.push(body);
    return Response.json({ segments: [{ ...railRoute, travelMode: "rail", journeys: body.transitRoutingPreference ? [chosen] : [scheduledJourneys[0]] }] });
  };
  try {
    const result = await fetchTripRoutes({ groups: [{ blockId: railRoute.blockId, points: [origin, { ...destination, arrivalMode: "rail", arrivalRouteKey: key }] }] });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].includeTransitAlternatives, true);
    assert.equal(requests[1].transitRoutingPreference, "FEWER_TRANSFERS");
    assert.equal(requests[0].groups[0].points[1].arrivalRouteKey, undefined);
    assert.deepEqual(result.segments[0].geometry, chosen.geometry);
  } finally { globalThis.fetch = originalFetch; }
});


test("an earlier alighting option uses a confirmed ride plus a real street walk and leaves its fare unknown", async () => {
  const calls = [];
  const source = { ...railRoute, travelMode: "rail", journeys: [scheduledJourneys[0]] };
  const result = await addWalkFinishAlternatives(source, destination, async (from, to) => {
    calls.push([from, to]);
    return { ...railRoute, travelMode: "walk", distanceMeters: 1100, durationSeconds: 1020, steps: [], geometry: { type: "LineString", coordinates: [[from.lng, from.lat], [to.lng, to.lat]] } };
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].name, "Siam");
  assert.deepEqual([calls[0][0].lng, calls[0][0].lat], scheduledJourneys[0].steps[1].arrivalLocation);
  const direct = result.journeys.find(item => item.steps.filter(step => step.travelMode === "transit").length === 1);
  assert.ok(direct);
  assert.equal(direct.steps.at(-1).travelMode, "walk");
  assert.equal(direct.durationSeconds, 1620);
  assert.equal(direct.fare, null);
  assert.equal(direct.currency, null);
  assert.equal(getWalkInstruction(direct.steps, direct.steps.length - 1, destination.name), `Walk to ${destination.name}`);
  assert.equal(source.journeys.length, 1, "The provider response was not mutated");
});

test("unverified, distant and excessively long walks never create station shortcuts", async () => {
  const source = { ...railRoute, travelMode: "rail", journeys: [scheduledJourneys[0]] };
  for (const response of [null, { ...railRoute, status: "fallback", travelMode: "walk" }, { ...railRoute, travelMode: "walk", distanceMeters: 3000, durationSeconds: 2000 }]) {
    assert.equal((await addWalkFinishAlternatives(source, destination, async () => response)).journeys.length, 1);
  }
  let calls = 0;
  await addWalkFinishAlternatives(source, { ...destination, lat: 20 }, async () => { calls++; return null; });
  assert.equal(calls, 0);
});
