// node --experimental-transform-types --experimental-loader ./tests/support/typescript-loader.mjs --test tests/tour/tour-policy.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAutoStartTour,
  countTargets,
  countTeachingSteps,
  hasSeenTour,
  MIN_TOUR_TARGETS,
  resolveTourSteps,
  statusForEndReason,
} from "../../components/tour/tour-policy.ts";
import { readTourRecords, tourStorageKey, writeTourRecord } from "../../components/tour/tour-storage.ts";

const FIXED_NOW = new Date("2026-11-13T09:00:00.000Z");

const tour = {
  id: "planner",
  version: 2,
  label: "Trip planner",
  steps: [
    { title: "Welcome", description: "Centred step" },
    { target: "planner.my-list", title: "My List", description: "Collect places" },
    { target: "planner.itinerary", title: "Days", description: "Plan days" },
    { target: "planner.garage", title: "Garage", description: "Add your EV" },
    { target: "sidebar.notifications", title: "Notifications", description: "Activity", requiresAuth: true },
  ],
};

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    values,
  };
}

const onScreen = (...targets) => (target) => (targets.includes(target) ? { target } : null);

const baseAutoStart = { ready: true, eligible: true, record: undefined, version: 2, anotherTourActive: false, overlayOpen: false };

test("finishing a tour marks it completed and every deliberate dismissal marks it dismissed", () => {
  assert.equal(statusForEndReason("done"), "completed");
  assert.equal(statusForEndReason("close"), "dismissed");
  assert.equal(statusForEndReason("escape"), "dismissed");
  assert.equal(statusForEndReason("overlay"), "dismissed");
});

test("a tour cut short by navigation or replaced by another records nothing so it is offered again", () => {
  assert.equal(statusForEndReason("api"), null);
  assert.equal(statusForEndReason("replaced"), null);
  assert.equal(statusForEndReason(undefined), null);
});

test("a record for an older version does not count as having seen a changed tour", () => {
  assert.equal(hasSeenTour(undefined, 2), false);
  assert.equal(hasSeenTour({ status: "dismissed", version: 1, at: "x" }, 2), false);
  assert.equal(hasSeenTour({ status: "completed", version: 2, at: "x" }, 2), true);
  assert.equal(hasSeenTour({ status: "dismissed", version: 3, at: "x" }, 2), true);
});

test("steps whose control is missing or hidden are skipped while centred steps stay", () => {
  const steps = resolveTourSteps(tour, { isAuthenticated: true, findTarget: onScreen("planner.itinerary", "sidebar.notifications") });
  assert.deepEqual(steps.map((entry) => entry.step.title), ["Welcome", "Days", "Notifications"]);
  assert.equal(countTargets(steps), 2);
});

test("steps that need an account are skipped for signed-out visitors even when their control is on screen", () => {
  const steps = resolveTourSteps(tour, {
    isAuthenticated: false,
    findTarget: onScreen("planner.my-list", "planner.itinerary", "planner.garage", "sidebar.notifications"),
  });
  assert.equal(steps.some((entry) => entry.step.title === "Notifications"), false);
  assert.equal(countTargets(steps), MIN_TOUR_TARGETS);
});

const featureTour = {
  id: "planner-days",
  version: 1,
  label: "Days and timing",
  steps: [
    { target: "planner.day-header", title: "Days", description: "One block per day" },
    { target: "planner.day-color", opens: "planner.day-options", title: "Colour", description: "Inside the day menu" },
    { target: "planner.day-times", title: "Times", description: "Needs places", fallback: { title: "Calculate times", description: "Add a place first" } },
    { target: "planner.missing", title: "Gone", description: "No menu and nothing to say" },
  ],
};

test("a step inside a closed menu is kept when the menu's trigger is on screen", () => {
  const steps = resolveTourSteps(featureTour, { isAuthenticated: true, findTarget: onScreen("planner.day-header", "planner.day-options") });
  assert.deepEqual(steps.map((entry) => entry.mode), ["target", "deferred", "fallback"]);
  assert.equal(countTargets(steps), 2);
});

test("a step whose menu trigger is missing too is dropped unless it can explain what to do", () => {
  const steps = resolveTourSteps(featureTour, { isAuthenticated: true, findTarget: onScreen() });
  assert.deepEqual(steps.map((entry) => entry.step.title), ["Times"]);
  assert.equal(steps[0].mode, "fallback");
  assert.equal(countTargets(steps), 0);
  assert.equal(countTeachingSteps(steps), 1);
});

test("an unless step stands in for a feature only until that feature is on screen", () => {
  const pair = {
    id: "planner-charging",
    version: 1,
    label: "Charging stops",
    steps: [
      { target: "planner.add-ev-station", unless: "planner.ev-preferences", title: "Open the charger list", description: "Set-up step" },
      { target: "planner.ev-preferences", title: "Charging preferences", description: "Panel step" },
    ],
  };
  const closed = resolveTourSteps(pair, { isAuthenticated: true, findTarget: onScreen("planner.add-ev-station") });
  assert.deepEqual(closed.map((entry) => entry.step.title), ["Open the charger list"]);
  const open = resolveTourSteps(pair, { isAuthenticated: true, findTarget: onScreen("planner.add-ev-station", "planner.ev-preferences") });
  assert.deepEqual(open.map((entry) => entry.step.title), ["Charging preferences"]);
});

test("a lone welcome card does not count as something to teach", () => {
  const steps = resolveTourSteps(tour, { isAuthenticated: true, findTarget: onScreen() });
  assert.deepEqual(steps.map((entry) => entry.mode), ["centred"]);
  assert.equal(countTeachingSteps(steps), 0);
});

test("auto-start happens only when the page is ready, the viewer is eligible and the tour is unseen", () => {
  assert.equal(canAutoStartTour(baseAutoStart), true);
  assert.equal(canAutoStartTour({ ...baseAutoStart, ready: false }), false);
  assert.equal(canAutoStartTour({ ...baseAutoStart, eligible: false }), false);
  assert.equal(canAutoStartTour({ ...baseAutoStart, record: { status: "completed", version: 2, at: "x" } }), false);
});

test("auto-start never interrupts an open dialog or another running tour", () => {
  assert.equal(canAutoStartTour({ ...baseAutoStart, overlayOpen: true }), false);
  assert.equal(canAutoStartTour({ ...baseAutoStart, anotherTourActive: true }), false);
});

test("progress is kept separately for each account and for guests", () => {
  const storage = memoryStorage();
  writeTourRecord(storage, "user-a", "planner", { status: "completed", version: 2 }, FIXED_NOW);

  assert.deepEqual(readTourRecords(storage, "user-a").planner, { status: "completed", version: 2, at: FIXED_NOW.toISOString() });
  assert.deepEqual(readTourRecords(storage, "user-b"), {});
  assert.deepEqual(readTourRecords(storage, null), {});
  assert.equal(tourStorageKey(null), "navio:tours:v1:guest");
  assert.equal(tourStorageKey("  "), "navio:tours:v1:guest");
});

test("writing one tour keeps the records of the others", () => {
  const storage = memoryStorage();
  writeTourRecord(storage, "user-a", "dashboard", { status: "dismissed", version: 1 }, FIXED_NOW);
  writeTourRecord(storage, "user-a", "community", { status: "completed", version: 1 }, FIXED_NOW);

  const records = readTourRecords(storage, "user-a");
  assert.equal(records.dashboard?.status, "dismissed");
  assert.equal(records.community?.status, "completed");
});

test("corrupt or unexpected stored progress reads as unseen instead of throwing", () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const key = tourStorageKey("user-a");
    assert.deepEqual(readTourRecords(memoryStorage({ [key]: "{not json" }), "user-a"), {});
    assert.deepEqual(readTourRecords(memoryStorage({ [key]: JSON.stringify({ planner: { status: "maybe", version: 1, at: "x" } }) }), "user-a"), {});
    assert.deepEqual(readTourRecords(memoryStorage({ [key]: JSON.stringify({ unknownTour: { status: "completed", version: 1, at: "x" } }) }), "user-a"), {});
  } finally {
    console.warn = originalWarn;
  }
});

test("blocked storage never throws on read or write", () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  const blocked = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("QuotaExceededError"); },
  };
  try {
    assert.deepEqual(readTourRecords(blocked, "user-a"), {});
    assert.doesNotThrow(() => writeTourRecord(blocked, "user-a", "planner", { status: "completed", version: 1 }, FIXED_NOW));
    assert.deepEqual(readTourRecords(null, "user-a"), {});
    assert.doesNotThrow(() => writeTourRecord(null, "user-a", "planner", { status: "completed", version: 1 }, FIXED_NOW));
  } finally {
    console.warn = originalWarn;
  }
});
