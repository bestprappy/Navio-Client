// node --experimental-transform-types --experimental-loader ./tests/support/typescript-loader.mjs --test tests/tour/tour-data.test.mjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { DASHBOARD_TOUR } from "../../app/feature/planner/_components/dashboard/tour/data.ts";
import { PLANNER_TOUR } from "../../app/feature/planner/planId/_components/tour/data.ts";
import { COMMUNITY_TOUR } from "../../app/feature/community/_components/tour/data.ts";
import { MIN_TOUR_TARGETS } from "../../components/tour/tour-policy.ts";
import { TOUR_IDS } from "../../components/tour/tour.types.ts";

const TOURS = [DASHBOARD_TOUR, PLANNER_TOUR, COMMUNITY_TOUR];

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const source = ["app", "components"].flatMap(sourceFiles).map((path) => readFileSync(path, "utf8")).join("\n");

test("every shipped tour has a unique registered id", () => {
  assert.deepEqual(TOURS.map((tour) => tour.id).sort(), [...TOUR_IDS].sort());
});

test("tours stay short enough to finish and have enough controls to be worth starting", () => {
  for (const tour of TOURS) {
    const targeted = tour.steps.filter((step) => step.target);
    assert.ok(targeted.length >= MIN_TOUR_TARGETS, `${tour.id} has too few targeted steps`);
    assert.ok(targeted.length <= 7, `${tour.id} has more than seven targeted steps`);
  }
});

test("every tour step points at a data-tour attribute that exists in the app", () => {
  for (const tour of TOURS) {
    for (const step of tour.steps) {
      if (!step.target) continue;
      const literal = `"${step.target}"`;
      const rendered = source.includes(`data-tour=${literal}`) || source.includes(`tourTarget=${literal}`) || source.includes(`: ${literal}}`);
      assert.ok(rendered, `${tour.id}: no element renders data-tour ${literal}`);
    }
  }
});
