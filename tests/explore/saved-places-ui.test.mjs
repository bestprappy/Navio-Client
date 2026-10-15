import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createStore, Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { SearchParamsContext, PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
// My List imports route widgets whose CSS modules are handled by Next in the app.
register("data:text/javascript," + encodeURIComponent(`export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', shortCircuit: true, source: 'export default {}' };
  return next(url, context);
}`), import.meta.url);
const { SavedPlacesSection, DaySavedPlacesPicker } = await import(
  "../../app/feature/planner/planId/_components/list/saved-places-section.tsx"
);
const { tripBlocksAtom, plannerReadOnlyAtom } = await import(
  "../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts"
);
const { AddPlaceToPlan } = await import(
  "../../app/feature/explore/places/plan-context.tsx"
);
const { MyListSection } = await import(
  "../../app/feature/planner/planId/_components/list/my-list-section.tsx"
);
const blocks = [
  {
    id: "list",
    kind: "list",
    title: "Ideas",
    date: "",
    items: [
      {
        id: "s",
        type: "place",
        placeId: "abc",
        name: "Garden",
        address: "Town",
        lat: 1,
        lng: 2,
      },
    ],
  },
  { id: "day", kind: "itinerary", date: "2026-10-15", items: [] },
];

test("Places is an accessible expandable subsection and day shortcut is hidden when read-only", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks);
  const render = (component) =>
    renderToStaticMarkup(React.createElement(Provider, { store }, component));
  const html = render(React.createElement(SavedPlacesSection));
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /Garden/);
  assert.match(html, /Search saved places/);
  assert.match(html, /Add Garden to a day/);
  assert.match(html, /Remove Garden from Ideas/);
  assert.match(
    render(React.createElement(DaySavedPlacesPicker, { dayId: "day" })),
    /Saved places \(1\)/,
  );
  store.set(plannerReadOnlyAtom, true);
  assert.equal(
    render(React.createElement(DaySavedPlacesPicker, { dayId: "day" })),
    "",
  );
  assert.doesNotMatch(
    render(React.createElement(SavedPlacesSection)),
    /Add Garden to a day/,
  );
  assert.doesNotMatch(
    render(React.createElement(SavedPlacesSection)),
    /Remove Garden from Ideas/,
  );
});

test("My List renders saved places once, inside the expandable subsection", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks);
  const client = new QueryClient();
  const content =
    React.createElement(
      Provider,
      { store },
      React.createElement(MyListSection, {
        destinationName: "Town",
        latitude: 1,
        longitude: 2,
        createDefaultList: false,
      }),
    );
  const html = renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: {} }, React.createElement(PathParamsContext.Provider, { value: { planId: "new" } }, React.createElement(SessionProvider, { session: null }, React.createElement(QueryClientProvider, { client }, content)))));
  assert.equal((html.match(/>Garden</g) || []).length, 1);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /Edit list title: Ideas/);
  assert.deepEqual(store.get(tripBlocksAtom), blocks);
  client.clear();
});

test("both ordinary browsing and connected-plan browsing use Add to Plan", () => {
  const id = "b2738cf9-9fb7-488c-9ec1-c08d2b23fb92";
  for (const params of [
    new URLSearchParams(),
    new URLSearchParams({ plan: id }),
  ]) {
    const client = new QueryClient();
    client.setQueryData(["discovery-plan", "owner", id], {
      id,
      destinationName: "Bangkok",
    });
    const html = renderToStaticMarkup(
      React.createElement(
        SearchParamsContext.Provider,
        { value: params },
        React.createElement(
          SessionProvider,
          { session: { user: { id: "owner" }, expires: "2099-01-01" } },
          React.createElement(
            QueryClientProvider,
            { client },
            React.createElement(AddPlaceToPlan, { placeId: "abc" }),
          ),
        ),
      ),
    );
    assert.match(html, /Add to Plan/);
    assert.doesNotMatch(html, /Choose a plan|Add to My List/);
    client.clear();
  }
});
