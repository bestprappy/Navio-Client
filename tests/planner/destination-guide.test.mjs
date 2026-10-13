import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const guideModule = "../../app/feature/planner/planId/_components/guide/";
const {
  GUIDE_PAGE_SIZE,
  getGuidePicks,
  findDestinationGuide,
  getVisibleGuideSections,
  nextVisibleCount,
} = await import(`${guideModule}destination-guide.ts`);
const { BANGKOK_GUIDE, DESTINATION_GUIDES } = await import(`${guideModule}data.ts`);

const BANGKOK_PLACE_ID = "ChIJ82ENKDJgHTERIEjiXbIAAQE";

test("findsTheBangkokGuideByTheDestinationsPlaceId", () => {
  assert.equal(findDestinationGuide({ id: BANGKOK_PLACE_ID, name: "Somewhere" }, DESTINATION_GUIDES), BANGKOK_GUIDE);
});

test("findsTheBangkokGuideByNameWhenTheDayHasNoProviderId", () => {
  assert.equal(findDestinationGuide({ id: "Bangkok", name: "Bangkok, Thailand" }, DESTINATION_GUIDES), BANGKOK_GUIDE);
  assert.equal(findDestinationGuide({ id: "x", name: "Krung Thep Maha Nakhon" }, DESTINATION_GUIDES), BANGKOK_GUIDE);
});

test("showsNoGuideForADestinationWithoutOne", () => {
  assert.equal(findDestinationGuide({ id: "ChIJWV8GL4-h4jARCvzY7dWvlUE", name: "Samut Prakan" }, DESTINATION_GUIDES), null);
  assert.equal(findDestinationGuide({ id: "x", name: "Bangkok Noi" }, DESTINATION_GUIDES), null);
  assert.equal(findDestinationGuide(null, DESTINATION_GUIDES), null);
});

test("listsTheFirstPageOfEverySectionByDefault", () => {
  const sections = getVisibleGuideSections(BANGKOK_GUIDE, {});
  assert.deepEqual(sections.map((section) => section.id), ["visit", "eat", "stay"]);
  for (const section of sections) {
    assert.equal(section.visiblePlaces.length, GUIDE_PAGE_SIZE);
    assert.deepEqual(section.visiblePlaces, section.places.slice(0, GUIDE_PAGE_SIZE));
  }
});

test("showMoreAddsAPageWithoutPassingTheTotal", () => {
  assert.equal(nextVisibleCount(5, 12, "more"), 10);
  assert.equal(nextVisibleCount(10, 12, "more"), 12);
  assert.equal(nextVisibleCount(5, 8, "more"), 8);
});

test("seeAllListsEveryPlaceAndShowLessReturnsToTheFirstPage", () => {
  assert.equal(nextVisibleCount(5, 8, "all"), 8);
  assert.equal(nextVisibleCount(8, 8, "less"), GUIDE_PAGE_SIZE);
  assert.equal(nextVisibleCount(3, 3, "less"), 3);
});

test("ignoresAStoredCountOutsideTheSectionsRange", () => {
  const [visit] = getVisibleGuideSections(BANGKOK_GUIDE, { visit: 999 });
  assert.equal(visit.visibleCount, visit.places.length);
  const [shrunk] = getVisibleGuideSections(BANGKOK_GUIDE, { visit: 1 });
  assert.equal(shrunk.visibleCount, GUIDE_PAGE_SIZE);
});

test("dayCardPicksTakeTheTopPlaceOfEachSectionInTurn", () => {
  const picks = getGuidePicks(BANGKOK_GUIDE, 5);
  assert.deepEqual(picks.map(({ section }) => section.id), ["visit", "eat", "stay", "visit", "eat"]);
  assert.deepEqual(picks.slice(0, 3).map(({ place, section }) => place.id), BANGKOK_GUIDE.sections.map((section) => section.places[0].id));
  assert.equal(picks[3].place, BANGKOK_GUIDE.sections[0].places[1]);
});

test("dayCardPicksStopWhenEverySectionRunsOut", () => {
  const total = BANGKOK_GUIDE.sections.reduce((sum, section) => sum + section.places.length, 0);
  assert.equal(getGuidePicks(BANGKOK_GUIDE, 999).length, total);
  assert.deepEqual(getGuidePicks(BANGKOK_GUIDE, 0), []);
});

test("theCoverPhotoComesFromAListedPlace", () => {
  const ids = BANGKOK_GUIDE.sections.flatMap((section) => section.places.map((place) => place.id));
  assert.ok(ids.includes(BANGKOK_GUIDE.coverPlaceId));
});

test("everyGuidePlaceIsAUniqueGooglePlaceWithoutStoredRatingsOrPhotos", () => {
  const places = BANGKOK_GUIDE.sections.flatMap((section) => section.places);
  assert.equal(new Set(places.map((place) => place.id)).size, places.length);
  for (const place of places) {
    assert.equal(place.id, `GOOGLE:${place.providerPlaceId}`);
    assert.ok(place.blurb.length > 0, `${place.name} needs a description`);
    assert.equal(place.rating, undefined);
    assert.equal(place.imageUrl, undefined);
  }
});
