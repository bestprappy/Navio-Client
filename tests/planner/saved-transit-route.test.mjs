import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { origin, destination, railRoute, scheduledJourneys } = await import("./travel-options/data.ts");
const { getTransitRouteKey, applySavedTransitRoutes } = await import("../../app/feature/planner/planId/_components/routes/transit-route-choice.ts");
const { fetchTripRoutes } = await import("../../app/feature/planner/planId/_components/routes/trip-route-api.ts");
const chosen = scheduledJourneys[1];
const key = getTransitRouteKey(chosen.steps);
const request = { profile: "driving-traffic", groups: [{ blockId: railRoute.blockId,
  points: [origin, { ...destination, arrivalMode: "rail", arrivalRouteKey: key }] }] };

test("a saved route is confirmed when it is the primary route but absent from the alternatives", () => {
  for (const journeys of [undefined, [], [scheduledJourneys[0]]]) {
    const segment = { ...railRoute, steps: chosen.steps, geometry: chosen.geometry,
      distanceMeters: chosen.distanceMeters, durationSeconds: chosen.durationSeconds, journeys };
    const restored = applySavedTransitRoutes(request, { segments: [segment] }).segments[0];
    assert.equal(restored.status, "routed");
    assert.deepEqual(restored.geometry, chosen.geometry);
    assert.equal(restored.durationSeconds, chosen.durationSeconds);
  }
});

test("saved rail choices use the same general transit search that found them in the route list", async t => {
  const requests = [];
  const departureTime = "2026-10-14T04:00:00Z";
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    return Response.json({ segments: [{ ...railRoute, journeys:
      body.groups[0].points[1].arrivalMode === "transit" ? [chosen] : [scheduledJourneys[0]] }] });
  });
  const before = structuredClone(request);
  const restored = (await fetchTripRoutes({ ...request, departureTime })).segments[0];
  assert.equal(restored.status, "routed");
  assert.deepEqual(restored.geometry, chosen.geometry);
  assert.equal(restored.travelMode, "transit");
  assert.ok(requests.some(body => body.groups[0].points[1].arrivalMode === "transit"));
  assert.ok(requests.every(body => body.departureTime === departureTime));
  assert.ok(requests.every(body => body.groups[0].points.every(point => point.arrivalRouteKey === undefined)));
  assert.deepEqual(request, before);
});

test("a saved line sequence no search offers shows the closest confirmed journey, flagged", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ segments: [{ ...railRoute, journeys: [scheduledJourneys[0]] }] });
  });
  const restored = (await fetchTripRoutes(request)).segments[0];
  assert.equal(restored.status, "routed");
  assert.equal(restored.savedRouteUnavailable, true);
  assert.equal(restored.fallbackReason, null);
  assert.notEqual(getTransitRouteKey(restored.steps), key);
  assert.ok(calls <= 8, "Recovery calls must be bounded");
});

test("a saved route stays unverified when no search confirms any transit journey", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ segments: [{ ...railRoute,
    status: "fallback", durationSeconds: null, distanceMeters: null, steps: [], journeys: [] }] }));
  const restored = (await fetchTripRoutes(request)).segments[0];
  assert.equal(restored.status, "fallback");
  assert.equal(restored.fallbackReason, "Your selected transit route is not available");
  assert.equal(restored.durationSeconds, null);
  assert.deepEqual(restored.steps, []);
});

test("a fallback primary never verifies a saved route even when its old steps match", () => {
  const restored = applySavedTransitRoutes(request, { segments: [{ ...railRoute,
    status: "fallback", steps: chosen.steps, journeys: [] }] }).segments[0];
  assert.equal(restored.status, "fallback");
});

test("a saved rail alternative survives a general search whose primary journey includes a bus", async t => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    const general = body.groups[0].points[1].arrivalMode === "transit";
    return Response.json({ segments: [{ ...railRoute,
      steps: general ? chosen.steps.map(step => step.travelMode === "transit"
        ? { ...step, line: { ...step.line, vehicleType: "BUS" } } : step) : railRoute.steps,
      journeys: general ? [chosen] : [scheduledJourneys[0]] }] });
  });
  const restored = (await fetchTripRoutes(request)).segments[0];
  assert.equal(restored.status, "routed");
  assert.deepEqual(restored.steps, chosen.steps);
});

test("recovery retains the saved rail restriction instead of confirming a mixed journey", async t => {
  const mixed = { ...chosen, steps: chosen.steps.map(step => step.travelMode === "transit"
    ? { ...step, line: { ...step.line, vehicleType: "BUS" } } : step) };
  const invalidChoice = { ...request, groups: [{ ...request.groups[0], points: [origin,
    { ...request.groups[0].points[1], arrivalRouteKey: getTransitRouteKey(mixed.steps) }] }] };
  t.mock.method(globalThis, "fetch", async () => Response.json({ segments: [{ ...railRoute, journeys: [mixed] }] }));
  const restored = (await fetchTripRoutes(invalidChoice)).segments[0];
  assert.notEqual(getTransitRouteKey(restored.steps ?? []), getTransitRouteKey(mixed.steps));
  assert.ok((restored.steps ?? []).every(step => step.line?.vehicleType !== "BUS"));
  assert.equal(restored.status === "fallback" || restored.savedRouteUnavailable === true, true);
});

test("cancelling saved-route recovery stops the searches without publishing a fallback", async t => {
  const controller = new AbortController();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    if (++calls === 2) controller.abort();
    return Response.json({ segments: [{ ...railRoute, journeys: [scheduledJourneys[0]] }] });
  });
  await assert.rejects(fetchTripRoutes(request, controller.signal), { name: "AbortError" });
  assert.equal(calls, 2);
});
