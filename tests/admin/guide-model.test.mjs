import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const guides = "../../app/feature/admin/_components/guides/";
const model = await import(`${guides}guide-model.ts`);
const { BANGKOK_ADMIN_GUIDE } = await import(`${guides}data.ts`);
const { parseLegacyGuides, parseStoredGuides } = await import(`${guides}guide-storage.ts`);
const { parseNoteMarkdown, serializeNoteMarkdown } = await import("../../components/block-editor/note-markdown.ts");

const NOW = "2026-10-13T10:00:00.000Z";
const CHIANG_MAI = { provider: "GOOGLE", providerPlaceId: "ChIJ-chiang-mai", name: "Chiang Mai", lat: 18.79, lng: 98.98 };
const EMBEDS = [model.PLACE_LIST_EMBED, model.GUIDE_PLACE_EMBED];
const place = (id, name = id) => ({ id: `GOOGLE:${id}`, provider: "GOOGLE", providerPlaceId: id, name, address: "", lat: 0, lng: 0, tags: [] });

function newGuide() {
  return model.createGuide({ id: "chiang-mai-1", destination: CHIANG_MAI, country: "Thailand", now: NOW });
}

/** A guide whose text is the given blocks, with every place remembered. */
function withBody(guide, ...blocks) {
  let next = guide;
  for (const block of blocks) if (typeof block === "object") next = model.rememberPlace(next, block);
  const body = blocks.map((block) => (typeof block === "object" ? model.guidePlaceMarkdown(block.providerPlaceId) : block)).join("\n\n");
  return { ...next, body };
}

test("aNewGuideStartsWithAnEmptySectionPerDefaultCategory", () => {
  const sections = model.guideOutline(newGuide());
  assert.deepEqual(sections.map((section) => [section.listId, section.categoryId, section.places.length]), [["visit", "visit", 0], ["eat", "eat", 0], ["stay", "stay", 0]]);
  assert.equal(newGuide().countryCode, "TH");
});

test("cardsBelongToTheListHeaderAboveThemAndAreNumberedInReadingOrder", () => {
  const guide = withBody(
    newGuide(),
    model.placeListMarkdown("visit"),
    place("a"),
    "Text under a, which stays with it.",
    place("b"),
    model.placeListMarkdown("eat"),
    place("c"),
  );
  const sections = model.guideOutline(guide);
  assert.deepEqual(sections.map((section) => section.places.map((entry) => `${entry.key}#${entry.number}`)), [["a#1", "b#2"], ["c#1"]]);
  assert.equal(model.findOutlinePlace(sections, "c").section.listId, "eat");
  assert.ok(model.sectionHasPlace(sections, "visit", "b"));
  assert.ok(!model.sectionHasPlace(sections, "eat", "b"));
});

test("cardsAboveTheFirstListBelongToNoCategory", () => {
  const sections = model.guideOutline(withBody(newGuide(), place("loose"), model.placeListMarkdown("visit")));
  assert.equal(sections[0].listId, null);
  assert.equal(sections[0].places[0].number, 1);
});

test("guideBlocksSurviveAMarkdownRoundTripOnlyWhereTheEditorRegistersThem", () => {
  const { body } = BANGKOK_ADMIN_GUIDE;
  const doc = parseNoteMarkdown(body, EMBEDS);
  assert.equal(doc.content.filter((node) => node.type === "guidePlace").length, 24);
  assert.equal(doc.content.filter((node) => node.type === "placeList").length, 3);
  assert.equal(serializeNoteMarkdown(doc, EMBEDS), body);
  assert.equal(parseNoteMarkdown(model.placeListMarkdown("visit")).content[0].type, "paragraph", "a planner note keeps the line as literal text");
});

test("theSeedGuideKeepsEachPlacesWriteUpAsTextUnderItsCard", () => {
  const doc = parseNoteMarkdown(BANGKOK_ADMIN_GUIDE.body, EMBEDS);
  const index = doc.content.findIndex((node) => node.type === "guidePlace" && node.attrs.placeId === "ChIJPzZsMU6Z4jARQUzvk913bCo");
  assert.match(doc.content[index + 1].content[0].text, /Emerald Buddha/);
});

test("aPlaceIdThatCannotBeWrittenIntoTheTextIsRefused", () => {
  assert.equal(model.placeKey({ providerPlaceId: "poi.123:abc" }), null);
  const guide = newGuide();
  assert.equal(model.rememberPlace(guide, place("poi.123:abc")), guide);
  const doc = parseNoteMarkdown('<div data-embed="guidePlace" data-place-id="a b"></div>', EMBEDS);
  assert.equal(doc.content[0].type, "paragraph");
});

test("findsTheCountryCodeForAnEnglishCountryNameAndNothingForAnUnknownOne", () => {
  assert.equal(model.countryCodeFromName("Japan"), "JP");
  assert.equal(model.countryCodeFromName(" thailand "), "TH");
  assert.equal(model.countryCodeFromName("Atlantis"), null);
  assert.equal(model.countryFromSecondaryText("Bangkok, Thailand"), "Thailand");
});

test("groupsGuidesByCountryAlphabeticallyAndFiltersByCityOrCountry", () => {
  const tokyo = { ...newGuide(), id: "tokyo", name: "Tokyo", country: "Japan", countryCode: "JP" };
  const all = [BANGKOK_ADMIN_GUIDE, newGuide(), tokyo];
  const groups = model.groupGuidesByCountry(all);
  assert.deepEqual(groups.map((group) => group.country), ["Japan", "Thailand"]);
  assert.deepEqual(groups[1].guides.map((guide) => guide.name), ["Bangkok", "Chiang Mai"]);
  assert.deepEqual(model.filterGuides(all, "bang").map((guide) => guide.id), ["bangkok"]);
  assert.equal(model.filterGuides(all, "thai").length, 2);
});

test("aCategoryUsedByAListInTheTextCannotBeRemoved", () => {
  const guide = newGuide();
  assert.equal(model.removeCategory(guide, "visit"), guide);
  const unused = model.upsertCategory(guide, { id: "cafes", name: "Cafes", iconId: "coffee", colorId: "amber" });
  assert.equal(model.removeCategory(unused, "cafes").categories.length, 3);
});

test("aNewListTakesTheFirstCategoryNoListUsesYet", () => {
  const guide = model.upsertCategory(newGuide(), { id: "cafes", name: "Cafes", iconId: "coffee", colorId: "amber" });
  assert.equal(model.categoryForNewList(guide).id, "cafes");
  assert.equal(model.categoryForNewList(newGuide()).id, "visit");
});

test("aCardTakenOutOfTheTextKeepsItsPlaceForUndoButLeavesTheCounts", () => {
  const guide = withBody(newGuide(), model.placeListMarkdown("stay"), place("hotel"));
  const removed = { ...guide, body: model.placeListMarkdown("stay") };
  assert.ok(removed.places.hotel);
  assert.equal(model.countGuidePlaces(guide), 1);
  assert.equal(model.countGuidePlaces(removed), 0);
});

test("guidesSavedInTheFirstShapeMoveTheirPlacesAndWriteUpsIntoTheText", () => {
  const legacy = {
    ...newGuide(),
    body: [model.placeListMarkdown("visit"), "Intro", model.placeListMarkdown("eat")].join("\n\n"),
    lists: {
      visit: { id: "visit", categoryId: "visit", places: [{ ...place("temple", "Temple"), blurb: "Go early *please*", tags: [] }] },
      eat: { id: "eat", categoryId: "eat", places: [] },
    },
  };
  delete legacy.places;
  const [migrated] = parseLegacyGuides(JSON.stringify([legacy]));
  const sections = model.guideOutline(migrated);
  assert.equal(sections[0].places[0].place.name, "Temple");
  assert.match(migrated.body, /Go early \\\*please\\\*/);
  assert.deepEqual(migrated.lists.visit, { id: "visit", categoryId: "visit" });
  assert.ok(parseStoredGuides(JSON.stringify([migrated])), "a migrated guide is a valid current guide");
});

test("storedGuidesWithAnUnexpectedShapeAreRejected", () => {
  assert.equal(parseStoredGuides(null), null);
  assert.equal(parseStoredGuides("not json"), null);
  assert.equal(parseStoredGuides(JSON.stringify([{ id: "x" }])), null);
  const browserGuide = { ...BANGKOK_ADMIN_GUIDE };
  for (const field of ["status", "version", "publishedAt", "updatedByName"]) delete browserGuide[field];
  assert.deepEqual(parseStoredGuides(JSON.stringify([browserGuide])), [browserGuide]);
});

const { toDestinationGuide, textUnderCards, NAVIO_TEAM } = await import(`${guides}guide-to-destination.ts`);
const { BANGKOK_GUIDE } = await import("../../app/feature/planner/planId/_components/guide/data.ts");
const { findDestinationGuide } = await import("../../app/feature/planner/planId/_components/guide/destination-guide.ts");

test("theWrittenBangkokGuideReachesThePlannerWithTheSamePlacesAndWriteUps", () => {
  const planner = toDestinationGuide(BANGKOK_ADMIN_GUIDE);
  assert.equal(planner.author, NAVIO_TEAM);
  assert.deepEqual(planner.sections.map((section) => [section.id, section.title, section.places.length]), BANGKOK_GUIDE.sections.map((section) => [section.id, section.title, 8]));
  assert.deepEqual(planner.sections[0].places.map((entry) => entry.blurb), BANGKOK_GUIDE.sections[0].places.map((entry) => entry.blurb));
  assert.equal(findDestinationGuide({ id: "ChIJ82ENKDJgHTERIEjiXbIAAQE", name: "x" }, [planner]), planner);
  assert.equal(findDestinationGuide({ id: "other", name: "Bangkok, Thailand" }, [planner]), planner);
});

test("aPlacesWriteUpIsAllTheTextUnderItsCardUntilTheNextBlock", () => {
  const body = [model.placeListMarkdown("visit"), "Intro, not about a place.", model.guidePlaceMarkdown("a"), "First **line**.", "- tip one\n- tip two", model.guidePlaceMarkdown("b"), model.placeListMarkdown("eat"), "Next intro."].join("\n\n");
  assert.deepEqual([...textUnderCards(body)], [["a", "First line. tip one tip two"], ["b", ""]]);
});

test("aGuideWithNoPlacesIsNotShownToTravelers", () => {
  assert.equal(toDestinationGuide(newGuide()), null);
  const sections = toDestinationGuide(withBody(newGuide(), model.placeListMarkdown("visit"), place("a"), model.placeListMarkdown("eat"))).sections;
  assert.deepEqual(sections.map((section) => section.id), ["visit"], "an empty list is left out");
});

test("aPlaceTakesTrimmedDistinctTagsUpToTheLimit", () => {
  let guide = withBody(newGuide(), model.placeListMarkdown("visit"), { ...place("a"), tags: [] });
  guide = model.addPlaceTag(guide, "a", "  Night   market ");
  assert.deepEqual(guide.places.a.tags, ["Night market"]);
  assert.equal(model.addPlaceTag(guide, "a", "night MARKET"), guide, "a repeated tag is refused, ignoring case");
  assert.equal(model.addPlaceTag(guide, "a", "   "), guide, "a blank tag is refused");
  for (const tag of ["b", "c", "d", "e", "f", "g"]) guide = model.addPlaceTag(guide, "a", tag);
  assert.equal(guide.places.a.tags.length, model.MAX_PLACE_TAGS);
  assert.deepEqual(model.removePlaceTag(guide, "a", "Night market").places.a.tags, ["b", "c", "d", "e", "f"]);
});

test("tagsTravelToThePlannerAndOldSavesWithoutTagsStillLoad", () => {
  const planner = toDestinationGuide(BANGKOK_ADMIN_GUIDE);
  assert.deepEqual(planner.sections[0].places[0].tags, BANGKOK_GUIDE.sections[0].places[0].tags);
  const stored = JSON.parse(JSON.stringify([BANGKOK_ADMIN_GUIDE]));
  for (const entry of Object.values(stored[0].places)) delete entry.tags;
  assert.deepEqual(parseStoredGuides(JSON.stringify(stored))[0].places.ChIJPzZsMU6Z4jARQUzvk913bCo.tags, []);
});
