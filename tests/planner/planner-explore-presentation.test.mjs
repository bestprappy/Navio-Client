import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

register(new URL("../support/typescript-loader.mjs", import.meta.url));

const exploreSection = await import(
  "../../app/feature/planner/planId/_components/explore/explore-section.tsx"
);

test("planner Explore presents shared plans and travel guides as one ordered experience", () => {
  const ExploreContent = exploreSection.PlannerExploreContent;
  const html = typeof ExploreContent === "function"
    ? renderToStaticMarkup(createElement(ExploreContent, {
      countryLabel: "Thailand",
      destinationLabel: "Bangkok, Chiang Mai",
      sharedPlans: createElement("p", null, "Shared carousel"),
      travelGuides: createElement("p", null, "Guide carousel"),
    }))
    : "";

  assert.match(html, /data-slot="planner-explore-frame"/);
  assert.match(html, /data-slot="planner-shared-plans-module"/);
  assert.match(html, /data-slot="planner-travel-guides-module"/);
  assert.match(html, />Shared plans</);
  assert.match(html, />Travel guides</);
  assert.match(html, /Bangkok, Chiang Mai/);
  assert.ok(html.indexOf(">Shared plans<") < html.indexOf(">Travel guides<"));
  assert.ok(html.indexOf("Shared carousel") < html.indexOf("Guide carousel"));
});

test("planner Explore frame clips carousel spill at its outer boundary", () => {
  const ExploreContent = exploreSection.PlannerExploreContent;
  const html = typeof ExploreContent === "function"
    ? renderToStaticMarkup(createElement(ExploreContent, {
      countryLabel: "Thailand",
      destinationLabel: "Bangkok",
      sharedPlans: createElement("div", null, "Shared carousel"),
      travelGuides: createElement("div", null, "Guide carousel"),
    }))
    : "";

  const frame = html.match(/<div[^>]+data-slot="planner-explore-frame"[^>]*>/)?.[0] ?? "";
  assert.match(frame, /overflow-(?:hidden|clip)/);
  assert.match(frame, /min-w-0/);
});

test("shared plans use bounded Shadcn carousel motion", () => {
  const options = exploreSection.PLANNER_EXPLORE_CAROUSEL_OPTIONS;

  assert.deepEqual(options, {
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    duration: 18,
    loop: false,
    skipSnaps: false,
  });
});
