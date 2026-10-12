import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function resolveModule(basePath) {
  for (const candidate of [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    resolve(basePath, "index.ts"),
    resolve(basePath, "index.tsx"),
    resolve(basePath, "index.js"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return pathToFileURL(candidate).href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["next/link", "next/image"].includes(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    if (specifier.startsWith("@/")) {
      const resolved = resolveModule(resolve(process.cwd(), specifier.slice(2)));
      if (resolved) return { shortCircuit: true, url: resolved };
    }
    if (specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) && context.parentURL?.startsWith("file:")) {
      const resolved = resolveModule(resolve(dirname(fileURLToPath(context.parentURL)), specifier));
      if (resolved) return { shortCircuit: true, url: resolved };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!/\.tsx?$/.test(url)) return nextLoad(url, context);
    return {
      format: "module",
      shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ESNext,
        },
      }).outputText,
    };
  },
});

const destinationHelpers = await import(
  "../../app/feature/planner/_components/trip-destinations.ts"
);
const exploreApi = await import(
  "../../app/feature/explore/_components/shared-plans/explore-plans-api.ts"
);
const exploreSection = await import(
  "../../app/feature/planner/planId/_components/explore/explore-section.tsx"
);

function plan(token, city, country = "Thailand") {
  return {
    token,
    title: `${city} plan ${token}`,
    authorName: "Navio traveler",
    destinationCity: city,
    destinationCountry: country,
    dayCount: 2,
    placeCount: 4,
    chargerCount: 0,
    coverImageUrl: null,
    highlights: [],
    days: [],
    listedAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  };
}

test("one destination keeps the first ten trending plans", () => {
  const trending = Array.from({ length: 12 }, (_, index) =>
    plan(`bangkok-${index + 1}`, "Bangkok"),
  );
  const select = destinationHelpers.selectPlannerExplorePlans;
  const selected = typeof select === "function" ? select(["Bangkok"], trending) : [];

  assert.deepEqual(
    selected.map((item) => item.token),
    Array.from({ length: 10 }, (_, index) => `bangkok-${index + 1}`),
  );
});

test("three destinations share ten slides in chronological round-robin order", () => {
  const trending = [
    ...Array.from({ length: 5 }, (_, index) => plan(`bangkok-${index + 1}`, "Bangkok")),
    ...Array.from({ length: 5 }, (_, index) => plan(`chiang-mai-${index + 1}`, "Chiang Mai")),
    ...Array.from({ length: 5 }, (_, index) => plan(`phuket-${index + 1}`, "Phuket")),
  ];

  const selected = destinationHelpers.selectPlannerExplorePlans(
    ["Bangkok", "Chiang Mai", "Phuket"],
    trending,
  );

  assert.deepEqual(selected.map((item) => item.token), [
    "bangkok-1", "chiang-mai-1", "phuket-1",
    "bangkok-2", "chiang-mai-2", "phuket-2",
    "bangkok-3", "chiang-mai-3", "phuket-3",
    "bangkok-4",
  ]);
});

test("the planner uses only the first ten unique destination labels", () => {
  const destinations = [
    " Bangkok ",
    "bangkok",
    "Chiang Mai",
    "Phuket",
    "Krabi",
    "Pattaya",
    "Ayutthaya",
    "Chiang Rai",
    "Kanchanaburi",
    "Hua Hin",
    "Khao Yai",
    "Udon Thani",
  ];
  const getVisible = destinationHelpers.getPlannerExploreDestinations;
  const visible = typeof getVisible === "function" ? getVisible(destinations) : [];

  assert.deepEqual(visible, [
    "Bangkok",
    "Chiang Mai",
    "Phuket",
    "Krabi",
    "Pattaya",
    "Ayutthaya",
    "Chiang Rai",
    "Kanchanaburi",
    "Hua Hin",
    "Khao Yai",
  ]);
});

test("city and city-country labels do not consume separate destination slots", () => {
  const visible = destinationHelpers.getPlannerExploreDestinations([
    "Bangkok",
    "Bangkok, Thailand",
    "Chiang Mai, Thailand",
  ]);

  assert.deepEqual(visible, ["Bangkok", "Chiang Mai, Thailand"]);
});

test("the planner can request a larger trending candidate window", async (context) => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      content: [],
      number: 0,
      last: true,
      totalElements: 0,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  await exploreApi.fetchExplorePlansPage(0, undefined, "trending", 48);

  const url = new URL(requestedUrl, "http://navio.test");
  assert.equal(url.searchParams.get("sort"), "trending");
  assert.equal(url.searchParams.get("size"), "48");
});

test("the combined plan carousel renders full-width slides and compact top-right arrows", () => {
  const CarouselView = exploreSection.PlannerExploreCarousel;
  const html = typeof CarouselView === "function"
    ? renderToStaticMarkup(createElement(CarouselView, {
      destinations: ["Bangkok", "Chiang Mai"],
      plans: [plan("bangkok-1", "Bangkok"), plan("chiang-mai-1", "Chiang Mai")],
      isLoading: false,
      isError: false,
      onRetry() {},
    }))
    : "";

  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-label="Shared plans for Bangkok, Chiang Mai"/);
  assert.equal((html.match(/data-slot="carousel-item"/g) ?? []).length, 2);
  const previous = html.match(/<button[^>]+data-slot="carousel-previous"[^>]*>/)?.[0] ?? "";
  const next = html.match(/<button[^>]+data-slot="carousel-next"[^>]*>/)?.[0] ?? "";
  for (const className of ["top-3", "right-11", "size-7", "left-auto"]) {
    assert.match(previous, new RegExp(`(?:^|\\s)${className}(?:\\s|\")`));
  }
  for (const className of ["top-3", "right-3", "size-7"]) {
    assert.match(next, new RegExp(`(?:^|\\s)${className}(?:\\s|\")`));
  }
  assert.doesNotMatch(html, /data-slot="carousel-(?:previous|next)"[^>]+top-1\/2/);
});
