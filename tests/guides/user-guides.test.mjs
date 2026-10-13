import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({
  resolve(specifier, context, next) {
    return next(
      !context.parentURL?.includes("/node_modules/") &&
        specifier.startsWith(".") &&
        !/\.(ts|tsx|js|mjs|json)$/.test(specifier)
        ? `${specifier}.ts`
        : specifier,
      context,
    );
  },
});
const { tripGuideDestinations, tripGuideDiscoveryScopes } =
  await import("../../app/feature/guides/trip-guide-destinations.ts");
const { guideReadingBlocks } =
  await import("../../app/feature/guides/guide-reading-model.ts");
const { userGuideWorkspace, guideSearchParams, discoverGuides } =
  await import("../../app/feature/guides/user-guides-api.ts");
const { createGuide, guidePlaceMarkdown, placeListMarkdown } =
  await import("../../app/feature/admin/_components/guides/guide-model.ts");

const day = (name, id, index, kind = "itinerary") => ({
  id: `day-${index}`,
  kind,
  date: `2026-10-${String(index + 1).padStart(2, "0")}`,
  destination: name ? { id, name, lat: 0, lng: 0 } : null,
  items: [],
});
test("a four-city trip queries all four destinations by place identity and ignores lists", () => {
  const locations = tripGuideDestinations("Bangkok", [
    day("Tokyo", "ChIJTokyo", 2),
    day("Bangkok", "ChIJBangkok", 0),
    day("Kyoto", "ChIJKyoto", 3),
    day("Taipei", "GOOGLE:ChIJTaipei", 1),
    day("Bangkok", "ChIJBangkok", 4),
    day("Other", "ChIJOther", 5, "list"),
  ]);
  assert.deepEqual(
    locations.map((city) => city.name),
    ["Bangkok", "Taipei", "Tokyo", "Kyoto"],
  );
  assert.deepEqual(
    locations.map((city) => city.filter.destinations[0]),
    [
      "GOOGLE:ChIJBangkok",
      "GOOGLE:ChIJTaipei",
      "GOOGLE:ChIJTokyo",
      "GOOGLE:ChIJKyoto",
    ],
  );
  assert.ok(locations.every((city) => !city.filter.cities));
});
test("days inheriting the original city remain discoverable alongside explicit city changes", () => {
  assert.deepEqual(
    tripGuideDestinations("Bangkok, Thailand", [
      day(null, "", 0),
      day("Kyoto", "", 1),
    ]).map((city) => city.name),
    ["Bangkok", "Kyoto"],
  );
  assert.deepEqual(
    tripGuideDestinations("Tokyo", []).map((city) => city.filter.cities),
    [["Tokyo"]],
  );
  assert.deepEqual(tripGuideDestinations("", []), []);
});

test("an explicit first city replaces the original destination for following days", () => {
  assert.deepEqual(
    tripGuideDestinations("Bangkok", [
      day("Kyoto", "ChIJKyoto", 0),
      day(null, "", 1),
    ]).map((city) => city.name),
    ["Kyoto"],
  );
});
test("user editor operations use owner routes and account-specific caches", async (t) => {
  const calls = [];
  const mine = userGuideWorkspace("writer-a");
  assert.notDeepEqual(mine.keys.list, userGuideWorkspace("writer-b").keys.list);
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push([url, init.method]);
    return new Response(null, { status: 204 });
  });
  await mine.delete({ id: "a", version: 7 });
  assert.deepEqual(calls, [
    ["/api/users/me/guides/a?expectedVersion=7", "DELETE"],
  ]);
});
test("public search escapes user input into query parameters and preserves pagination and all cities", () => {
  const query = guideSearchParams(
    {
      term: "Japan & cafés",
      cities: ["Tokyo", "Kyoto"],
      country: "JP",
      size: 3,
    },
    2,
  );
  assert.equal(query.get("term"), "Japan & cafés");
  assert.deepEqual(query.getAll("city"), ["Tokyo", "Kyoto"]);
  assert.equal(query.get("page"), "2");
});
test("malformed public pages are rejected instead of rendering unvalidated cards", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      content: [{ author: null }],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    }),
  );
  await assert.rejects(() => discoverGuides({}), /cannot read/);
});
test("reading preserves prose and empty headings and numbers only resolved places", () => {
  const guide = createGuide({
    id: "reader",
    now: "2026-10-13T00:00:00Z",
    country: "Japan",
    destination: {
      provider: "GOOGLE",
      providerPlaceId: "city",
      name: "Tokyo",
      lat: 0,
      lng: 0,
    },
  });
  guide.places = {
    cafe: {
      id: "GOOGLE:cafe",
      provider: "GOOGLE",
      providerPlaceId: "cafe",
      name: "Cafe",
      address: "",
      lat: 0,
      lng: 0,
      tags: [],
    },
  };
  guide.body = [
    "Start **here**.",
    placeListMarkdown("visit"),
    guidePlaceMarkdown("missing"),
    guidePlaceMarkdown("cafe"),
    "Walk to the river.",
    placeListMarkdown("eat"),
  ].join("\n\n");
  const blocks = guideReadingBlocks(guide);
  assert.deepEqual(
    blocks.map((block) => block.kind),
    ["text", "section", "place", "text", "section"],
  );
  assert.equal(blocks[2].number, 1);
  assert.equal(blocks[1].placeCount, 1);
  assert.equal(blocks[4].placeCount, 0);
  assert.equal(blocks[3].markdown, "Walk to the river.");
});

test("a Tokyo trip discovers all Japan guides instead of restricting discovery to Tokyo", () => {
  const scopes = tripGuideDiscoveryScopes(
    "Tokyo",
    [day("Tokyo", "ChIJTokyo", 0)],
    "Japan",
  );
  assert.deepEqual(
    scopes.map((scope) => scope.filter),
    [{ country: "Japan", size: 3 }],
  );
});
test("country discovery groups several cities once per country and retains unknown-country city matches", () => {
  const blocks = [
    day("Tokyo", "ChIJTokyo", 0),
    day("Osaka", "ChIJOsaka", 1),
    day("Bangkok", "ChIJBangkok", 2),
    day("Unknown", "ChIJUnknown", 3),
  ];
  blocks[0].destination.country = "Japan";
  blocks[1].destination.country = "JP";
  blocks[2].destination.country = "Thailand";
  const scopes = tripGuideDiscoveryScopes("Tokyo", blocks, "Japan");
  assert.deepEqual(
    scopes.map((scope) => scope.name),
    ["Japan", "Thailand", "Unknown"],
  );
  assert.deepEqual(scopes[2].filter.destinations, ["GOOGLE:ChIJUnknown"]);
});
test("a guide written for a country infers that country when autocomplete supplies no secondary text", () => {
  const guide = createGuide({
    id: "country",
    now: "2026-10-13T00:00:00Z",
    country: "",
    destination: {
      provider: "GOOGLE",
      providerPlaceId: "japan",
      name: "Japan",
      lat: 36,
      lng: 138,
    },
  });
  assert.equal(guide.country, "Japan");
  assert.equal(guide.countryCode, "JP");
});
