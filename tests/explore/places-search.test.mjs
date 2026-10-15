import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const {
  parsePlaceSearch,
  updatePlaceSearch,
  resultMode,
  partitionPlaces,
  countries,
  timeLabel,
} = await import("../../app/feature/explore/places/search-state.ts");
const item = (id) => ({
  place: {
    providerPlaceId: id,
    name: id,
    rating: 4.7,
    reviewCount: 100,
    location: { lat: 0, lng: 0 },
  },
  photoAttributions: [],
});
test("country and time preserve discovery, types and submitted query switch to results", () => {
  for (const query of [
    "",
    "country=JP&time=season:autumn",
    "interest=hidden-gems&interest=scenic",
  ])
    assert.equal(
      resultMode(parsePlaceSearch(new URLSearchParams(query))),
      false,
    );
  for (const query of [
    "type=restaurant",
    "placesQuery=Osaka+sushi",
    "interest=scenic&type=cafe",
  ])
    assert.equal(
      resultMode(parsePlaceSearch(new URLSearchParams(query))),
      true,
    );
});
test("URL validation rejects unknown values and accepts legacy month exclusively", () => {
  const value = parsePlaceSearch(
    new URLSearchParams(
      "country=XX&type=bad&type=cafe&type=cafe&time=season:autumn&month=1&interest=indoor",
    ),
  );
  assert.equal(value.country, "");
  assert.equal(value.time, "season:autumn");
  assert.deepEqual(value.types, ["cafe"]);
  assert.equal(
    parsePlaceSearch(new URLSearchParams("month=11")).time,
    "month:11",
  );
  assert.equal(
    parsePlaceSearch(new URLSearchParams("time=any&month=11")).time,
    "any",
  );
  assert.equal(timeLabel("season:wet"), "Season: Wet season");
});
test("editing context resets legacy city and paging while retaining plan and independent tab state", () => {
  const params = updatePlaceSearch(
    new URLSearchParams(
      "plan=trip&destination=Bangkok&lat=1&lng=2&month=9&collection=scenic&cursor=old&term=guide",
    ),
    { country: "JP", time: "any" },
  );
  assert.equal(params.get("plan"), "trip");
  assert.equal(params.get("country"), "JP");
  assert.equal(params.get("term"), "guide");
  for (const key of [
    "destination",
    "lat",
    "lng",
    "month",
    "collection",
    "cursor",
  ])
    assert.equal(params.has(key), false);
});
test("country options include all 249 ISO countries and territories without synthetic entries", () => {
  assert.equal(countries.length, 249);
  assert.equal(new Set(countries.map((c) => c.code)).size, 249);
  assert.equal(countries.find((c) => c.code === "JP").name, "Japan");
  assert.ok(countries.find((c) => c.code === "TH"));
});
test("recommendations obey row limits, do not pad, and retain every result across resize and paging", () => {
  const items = Array.from({ length: 26 }, (_, i) => item(String(i)));
  const eligible = items.slice(0, 22).map((i) => i.place.providerPlaceId);
  for (const columns of [1, 2, 3, 4]) {
    const partition = partitionPlaces([...items, items[0]], eligible, columns);
    assert.equal(partition.recommendations.length, columns * 5);
    assert.equal(
      new Set(
        [...partition.recommendations, ...partition.matches].map(
          (i) => i.place.providerPlaceId,
        ),
      ).size,
      26,
    );
    assert.equal(
      partition.matches.some((i) => partition.recommendations.includes(i)),
      false,
    );
  }
  assert.equal(
    partitionPlaces(items, ["0", "1", "2"], 2).recommendations.length,
    0,
  );
  assert.equal(partitionPlaces(items, [], 4).matches.length, 26);
});
test("time-only edits preserve legacy city and migrate its selected section", () => {
  const next = updatePlaceSearch(
    new URLSearchParams("destination=Bangkok&collection=scenic&month=9"),
    { time: "month:10" },
  );
  assert.equal(next.get("destination"), "Bangkok");
  assert.deepEqual(parsePlaceSearch(next).interests, ["scenic"]);
});
