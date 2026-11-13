// node --experimental-transform-types --experimental-loader ./tests/support/typescript-loader.mjs --test tests/tour/tour-data.test.mjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { DASHBOARD_TOUR } from "../../app/feature/planner/_components/dashboard/tour/data.ts";
import { ITINERARY_SECTION_TOURS, PLANNER_FEATURE_TOURS, PLANNER_TOUR } from "../../app/feature/planner/planId/_components/tour/data.ts";
import { COMMUNITY_TOUR } from "../../app/feature/community/_components/tour/data.ts";
import { MIN_TOUR_TARGETS } from "../../components/tour/tour-policy.ts";
import { TOUR_IDS } from "../../components/tour/tour.types.ts";

const AUTO_TOURS = [DASHBOARD_TOUR, PLANNER_TOUR, COMMUNITY_TOUR];
const TOURS = [...AUTO_TOURS, ...PLANNER_FEATURE_TOURS];

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    // Tour definitions are left out, so a target can't vouch for itself.
    return /\.tsx?$/.test(name) && !/[\\/]tour[\\/]data\.ts$/.test(path) ? [path] : [];
  });
}

const source = ["app", "components"].flatMap(sourceFiles).map((path) => readFileSync(path, "utf8")).join("\n");
const rendered = (value) => {
  const literal = `"${value}"`;
  return source.includes(`data-tour=${literal}`) || source.includes(`tourTarget=${literal}`) || source.includes(`: ${literal}`);
};

test("the target check reads app code, not the tour definitions it is checking", () => {
  assert.equal(source.includes('id: "planner-days"'), false);
  assert.equal(source.includes('id: "dashboard"'), false);
});

test("every shipped tour has a unique registered id", () => {
  assert.deepEqual(TOURS.map((tour) => tour.id).sort(), [...TOUR_IDS].sort());
});

test("tours that start by themselves have enough controls to be worth an interruption", () => {
  for (const tour of AUTO_TOURS) {
    const targeted = tour.steps.filter((step) => step.target);
    assert.ok(targeted.length >= MIN_TOUR_TARGETS, `${tour.id} has too few targeted steps`);
  }
});

test("every tour stays short enough to finish", () => {
  for (const tour of TOURS) assert.ok(tour.steps.length <= 8, `${tour.id} has ${tour.steps.length} steps`);
});

test("feature tours explain themselves in the tips menu", () => {
  for (const tour of PLANNER_FEATURE_TOURS) assert.ok(tour.summary && tour.summary.length <= 70, `${tour.id} needs a short summary`);
});

test("every tour step points at a data-tour attribute that exists in the app", () => {
  for (const tour of TOURS) {
    for (const step of tour.steps) {
      if (step.target) assert.ok(rendered(step.target), `${tour.id}: no element renders data-tour "${step.target}"`);
      if (step.opens) assert.ok(rendered(step.opens), `${tour.id}: no trigger renders data-tour "${step.opens}"`);
    }
  }
});

test("steps inside a menu name the menu that holds them", () => {
  const insideDayMenu = ["planner.day-color", "planner.day-times", "planner.auto-plan-action"];
  for (const tour of PLANNER_FEATURE_TOURS) {
    for (const step of tour.steps) {
      if (insideDayMenu.includes(step.target)) assert.equal(step.opens, "planner.day-options", `${tour.id}: ${step.target} needs opens`);
    }
  }
});

test("the itinerary's tips menu offers only planner feature tours", () => {
  for (const tour of ITINERARY_SECTION_TOURS) assert.ok(PLANNER_FEATURE_TOURS.includes(tour));
});
