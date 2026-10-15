import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { getPlannerSnapshot } = await import(
  "../../app/feature/planner/_components/planner-api.ts"
);
const { groupPlanChoices, preferredRecentPlanId } = await import(
  "../../app/feature/explore/places/plan-picker-model.ts"
);
const {
  collectListPlaces,
  scheduledDays,
  canSchedulePlace,
  visibleMyListBlocks,
} = await import(
  "../../app/feature/planner/planId/_components/list/saved-places-model.ts"
);

const trip = (id, updatedAt) => ({
  id,
  updatedAt,
  destinationName: id,
  displayName: null,
  title: null,
});

test("appended snapshot hydrates with server display defaults while malformed fields still fail validation", async (t) => {
  const snapshot = {
    blocks: [
      {
        id: "list",
        kind: "list",
        title: "My List",
        date: "2026-10-15",
        colorId: "teal",
        items: [
          {
            id: "saved",
            type: "place",
            placeId: "google-1",
            name: "Garden",
            address: "",
            lat: 13.7,
            lng: 100.5,
            isVisited: false,
          },
        ],
      },
    ],
    budget: { currency: "THB", amount: 0, expenses: [] },
    version: 5,
    savedAt: "2026-10-15T10:00:00Z",
  };
  t.mock.method(globalThis, "fetch", async () => Response.json(snapshot));
  assert.equal(
    (await getPlannerSnapshot("trip")).blocks[0].items[0].name,
    "Garden",
  );
  const malformed = structuredClone(snapshot);
  delete malformed.blocks[0].items[0].address;
  t.mock.method(globalThis, "fetch", async () => Response.json(malformed));
  await assert.rejects(getPlannerSnapshot("trip"), /invalid planner/);
  const noColor = structuredClone(snapshot);
  noColor.blocks[0].colorId = null;
  t.mock.method(globalThis, "fetch", async () => Response.json(noColor));
  await assert.rejects(getPlannerSnapshot("trip"), /invalid planner/);
});
test("Latest uses recent work over an old Explore URL and ignores another account's recent trip", () => {
  assert.equal(
    preferredRecentPlanId("owner", { ownerId: "owner", planId: "new" }, "old"),
    "new",
  );
  assert.equal(
    preferredRecentPlanId(
      "owner",
      { ownerId: "other", planId: "private" },
      "old",
    ),
    "old",
  );
});
test("latest prioritizes the owned recent plan, deduplicates pages and searches all groups", () => {
  const old = trip("old", "2026-01-01"),
    fresh = trip("fresh", "2026-10-15");
  const result = groupPlanChoices([old, fresh, old], "old", "");
  assert.equal(result.latest.id, "old");
  assert.deepEqual(
    result.trips.map((t) => t.id),
    ["fresh"],
  );
  assert.equal(
    groupPlanChoices([old, fresh], "deleted", "").latest.id,
    "fresh",
  );
  assert.equal(
    groupPlanChoices([old, fresh], "old", "fresh").latest,
    undefined,
  );
  assert.deepEqual(
    groupPlanChoices([old, fresh], "old", "fresh").trips.map((t) => t.id),
    ["fresh"],
  );
});
const place = {
  id: "saved",
  type: "place",
  placeId: "GOOGLE:abc",
  name: "Garden",
  address: "Town",
  lat: 1,
  lng: 2,
};
const blocks = [
  {
    id: "list",
    kind: "list",
    title: "Ideas",
    date: "",
    items: [
      place,
      { ...place, id: "saved2", placeId: "abc" },
      { ...place, id: "ev", placeId: "ev-charger:1" },
    ],
  },
  { id: "d2", kind: "itinerary", date: "2026-10-16", items: [] },
  {
    id: "d1",
    kind: "itinerary",
    date: "2026-10-15",
    items: [{ ...place, id: "visit", placeId: "abc" }],
  },
];
test("ordinary saved places render only in Places while mixed-list notes and EV stops remain", () => {
  const original = structuredClone(blocks);
  const mixed = {
    ...blocks[0],
    items: [
      ...blocks[0].items,
      { id: "note", type: "note", content: "Keep this note" },
    ],
  };
  const placeOnly = { ...blocks[0], id: "only", items: [place] };
  const empty = { ...blocks[0], id: "empty", items: [] };
  const visible = visibleMyListBlocks([mixed, placeOnly, empty]);
  assert.deepEqual(
    visible.map((block) => block.id),
    ["list", "only", "empty"],
  );
  assert.deepEqual(
    visible[0].items.map((item) => item.id),
    ["ev", "note"],
  );
  assert.deepEqual(blocks, original);
  assert.equal(mixed.items.length, 4);
});

test("saved places aggregate custom lists without EV chargers or duplicate provider IDs", () => {
  assert.equal(collectListPlaces(blocks).length, 1);
  assert.equal(collectListPlaces(blocks)[0].listTitle, "Ideas");
  assert.equal(blocks[0].items.length, 3);
});
test("scheduling recognizes normalized IDs, labels days chronologically and preserves collection", () => {
  assert.deepEqual(
    scheduledDays(blocks, place).map((d) => d.label),
    ["Day 1"],
  );
  assert.equal(canSchedulePlace(blocks, place, "d1"), false);
  assert.equal(canSchedulePlace(blocks, place, "d2"), true);
  assert.equal(canSchedulePlace(blocks, place, "list"), false);
  assert.equal(canSchedulePlace(blocks, place, "deleted"), false);
});

test("day shortcut writes one fresh visit, retains the saved place, and obeys read-only and stale-source guards", async () => {
  const { createStore } = await import("jotai");
  const { tripBlocksAtom, plannerReadOnlyAtom } = await import(
    "../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts"
  );
  const { scheduleSavedPlaceAtom } = await import(
    "../../app/feature/planner/planId/_components/list/saved-places.atoms.ts"
  );
  const store = createStore();
  const saved = {
    ...place,
    notes: "private note",
    time: "10:00",
    cost: 900,
    isVisited: true,
  };
  store.set(
    tripBlocksAtom,
    blocks.map((block) => ({
      ...block,
      colorId: "blue",
      items: block.kind === "list" ? [saved] : [],
    })),
  );
  const visitId = store.set(scheduleSavedPlaceAtom, {
    placeId: "abc",
    dayId: "d1",
  });
  assert.ok(visitId);
  store.set(scheduleSavedPlaceAtom, { placeId: "abc", dayId: "d1" });
  const snapshot = store.get(tripBlocksAtom);
  assert.equal(snapshot.find((b) => b.id === "d1").items.length, 1);
  const visit = snapshot.find((b) => b.id === "d1").items[0];
  assert.notEqual(visit.id, saved.id);
  assert.equal(visit.isVisited, false);
  assert.equal(visit.notes, undefined);
  assert.equal(visit.time, undefined);
  assert.equal(visit.cost, undefined);
  assert.deepEqual(snapshot.find((b) => b.id === "list").items, [saved]);
  store.set(plannerReadOnlyAtom, true);
  assert.equal(
    store.set(scheduleSavedPlaceAtom, { placeId: "abc", dayId: "d2" }),
    undefined,
  );
  store.set(plannerReadOnlyAtom, false);
  assert.equal(
    store.set(scheduleSavedPlaceAtom, { placeId: "missing", dayId: "d2" }),
    undefined,
  );
  assert.ok(store.set(scheduleSavedPlaceAtom, { placeId: "abc", dayId: "d2" }));
});
