import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { nearestTransitStation, stationHitRadiusMeters } = await import("../../app/feature/planner/planId/_components/routes/transit-station-click.ts");

const place = (id, primaryType, category) => ({
  id, provider: "GOOGLE", providerPlaceId: id, name: id, address: "Tokyo", lat: 35.7, lng: 139.6, primaryType, category,
});

test("ignoresStationClicksWhenZoomedTooFarOutToMeanOneStation", () => {
  assert.equal(stationHitRadiusMeters(35.7, 13), null);
  assert.equal(stationHitRadiusMeters(35.7, Number.NaN), null);
});

test("shrinksTheStationSearchRadiusAsTheMapZoomsIn", () => {
  const street = stationHitRadiusMeters(35.7, 15);
  const block = stationHitRadiusMeters(35.7, 17);
  assert.ok(street > block, `${street} should exceed ${block}`);
  assert.ok(block >= 20 && block <= 60, `zoom 17 radius ${block} should stay close to the icon`);
});

test("neverSearchesASmallerAreaThanTheMinimumStationRadius", () => {
  assert.equal(stationHitRadiusMeters(35.7, 21), 20);
});

test("picksTheClosestStationAndSkipsNearerShops", () => {
  const station = nearestTransitStation([
    place("ramen", "ramen_restaurant", "Ramen Restaurant"),
    place("higashi-koenji", "subway_station", "Subway Station"),
    place("koenji", "train_station", "Train Station"),
  ]);
  assert.equal(station?.id, "higashi-koenji");
});

test("recognisesAStationByItsCategoryWhenThePrimaryTypeIsMissing", () => {
  assert.equal(nearestTransitStation([place("asagaya", undefined, "Subway Station")])?.id, "asagaya");
});

test("findsNoStationWhenOnlyOtherPlacesAreNearby", () => {
  assert.equal(nearestTransitStation([place("cafe", "cafe", "Cafe")]), null);
  assert.equal(nearestTransitStation([]), null);
});
