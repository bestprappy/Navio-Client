// Run: node --experimental-transform-types --test tests/admin/google-usage.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  googleUsageSchema,
  meterCopy,
  meterState,
  metersByUrgency,
  monthPercent,
  projectedRunOut,
  summarize,
  usagePercent,
} from "../../app/feature/admin/_components/google-usage/google-usage-model.ts";

const MONTH = { monthStart: "2026-11-01T00:00:00Z", resetsAt: "2026-12-01T00:00:00Z" };
const onDay = (day) => ({ ...MONTH, asOf: `2026-11-${String(day).padStart(2, "0")}T00:00:00Z` });
const meter = (name, used, limit = 950) => ({ meter: name, used, limit, lastCountedAt: null });

test("usage is a share of the limit and never passes 100", () => {
  assert.equal(usagePercent(meter("A", 475)), 50);
  assert.equal(usagePercent(meter("A", 2000)), 100);
});

test("a limit of zero counts as fully used rather than dividing by zero", () => {
  assert.equal(usagePercent(meter("A", 0, 0)), 100);
  assert.equal(meterState(meter("A", 0, 0), onDay(5)), "reached");
});

test("the month position stays between 0 and 100", () => {
  assert.equal(monthPercent(onDay(16)), 50);
  assert.equal(monthPercent({ ...MONTH, asOf: "2026-12-15T00:00:00Z" }), 100);
  assert.equal(monthPercent({ ...MONTH, asOf: "2026-10-15T00:00:00Z" }), 0);
});

test("an unreadable date puts the line at the start instead of breaking the page", () => {
  assert.equal(monthPercent({ ...MONTH, asOf: "not a date" }), 0);
});

test("a fast pace predicts the day the allowance runs out", () => {
  // 10 days used half the allowance, so it runs out after 20 days.
  assert.equal(projectedRunOut(meter("A", 475), onDay(11)).toISOString(), "2026-11-21T00:00:00.000Z");
});

test("a pace that lasts until the reset predicts nothing", () => {
  assert.equal(projectedRunOut(meter("A", 100), onDay(11)), null);
});

test("no prediction during the first day, however busy", () => {
  assert.equal(projectedRunOut(meter("A", 500), { ...MONTH, asOf: "2026-11-01T06:00:00Z" }), null);
});

test("no prediction with no calls, or once the limit is already reached", () => {
  assert.equal(projectedRunOut(meter("A", 0), onDay(11)), null);
  assert.equal(projectedRunOut(meter("A", 950), onDay(11)), null);
});

test("states run from fine to reached", () => {
  assert.equal(meterState(meter("A", 100), onDay(11)), "ok");
  assert.equal(meterState(meter("A", 475), onDay(11)), "fast");
  assert.equal(meterState(meter("A", 760), onDay(29)), "nearly");
  assert.equal(meterState(meter("A", 950), onDay(29)), "reached");
});

test("the fullest meter comes first, compared by share and not raw count", () => {
  const sorted = metersByUrgency([meter("ROUTES", 1000, 4750), meter("PLACE_PHOTOS", 800), meter("PLACE_DETAILS", 10)]);
  assert.deepEqual(sorted.map((m) => m.meter), ["PLACE_PHOTOS", "ROUTES", "PLACE_DETAILS"]);
});

test("sorting does not reorder the caller's list", () => {
  const input = [meter("A", 1), meter("B", 2)];
  metersByUrgency(input);
  assert.equal(input[0].meter, "A");
});

test("the summary names the closest meter with its numbers", () => {
  assert.equal(
    summarize([meter("PLACE_PHOTOS", 1412, 1950), meter("ROUTES", 10, 4750)]),
    "Place photos is closest to its limit, at 1,412 of 1,950.",
  );
});

test("the summary says what stopped when one limit is reached", () => {
  assert.equal(
    summarize([meter("PLACE_PHOTOS", 950), meter("ROUTES", 10, 4750)]),
    "Place photos has reached its limit, so places show without photos.",
  );
});

test("the summary counts several reached limits", () => {
  assert.equal(summarize([meter("PLACE_PHOTOS", 950), meter("PLACE_DETAILS", 950)]), "2 limits have been reached this month.");
});

test("the summary is plain when nothing has been counted", () => {
  assert.equal(summarize([meter("PLACE_PHOTOS", 0)]), "No Google calls have been counted this month.");
  assert.equal(summarize([]), "No Google calls have been counted this month.");
});

test("with limits off the summary claims nothing about a meter", () => {
  assert.equal(summarize([meter("PLACE_PHOTOS", 950)], false), "Google calls are not being counted right now.");
});

test("a meter this page does not know yet still gets a readable name", () => {
  assert.equal(meterCopy("STREET_VIEW_IMAGES").name, "Street view images");
});

test("every meter the server reports has written copy", () => {
  for (const name of ["PLACES_AUTOCOMPLETE", "PLACE_DETAILS", "PLACE_PHOTOS", "PLACES_TEXT_SEARCH", "PLACES_NEARBY_SEARCH", "ROUTES"]) {
    assert.notEqual(meterCopy(name).limitEffect, "these Google calls stop", name);
  }
});

test("the schema accepts the server's report and refuses a malformed one", () => {
  const valid = {
    ...onDay(9), limitsEnforced: true, placesDiscoveryEnabled: false,
    meters: [meter("PLACE_PHOTOS", 412)],
  };
  assert.equal(googleUsageSchema.safeParse(valid).success, true);
  assert.equal(googleUsageSchema.safeParse({ ...valid, meters: [{ meter: "A", used: -1, limit: 1, lastCountedAt: null }] }).success, false);
  assert.equal(googleUsageSchema.safeParse({ ...valid, meters: undefined }).success, false);
});

test("with limits ignored a meter past its limit is over, not stopped", () => {
  assert.equal(meterState(meter("A", 1020), onDay(20), true), "over");
  assert.equal(meterState(meter("A", 950), onDay(20), true), "over");
  assert.equal(meterState(meter("A", 475), onDay(11), true), "fast");
});

test("with limits ignored the summary says calls continue and are billed", () => {
  assert.equal(
    summarize([meter("PLACE_DETAILS", 1020), meter("ROUTES", 10, 4750)], true, true),
    "Place details is past its free allowance, at 1,020 of 950. Calls continue and are billed.",
  );
  assert.equal(
    summarize([meter("PLACE_DETAILS", 1020), meter("PLACE_PHOTOS", 951)], true, true),
    "2 meters are past their free allowance. Calls continue and are billed.",
  );
  assert.equal(summarize([meter("PLACE_DETAILS", 10)], true, true), "Limits are ignored this month. Nothing has passed its free allowance yet.");
});

test("the schema reads the override time and treats an older server's missing field as none", () => {
  const base = { ...onDay(9), limitsEnforced: true, placesDiscoveryEnabled: false, meters: [] };
  assert.equal(googleUsageSchema.parse(base).limitsIgnoredSince, null);
  assert.equal(googleUsageSchema.parse({ ...base, limitsIgnoredSince: null }).limitsIgnoredSince, null);
  assert.equal(
    googleUsageSchema.parse({ ...base, limitsIgnoredSince: "2026-11-14T15:00:00Z" }).limitsIgnoredSince,
    "2026-11-14T15:00:00Z",
  );
});
