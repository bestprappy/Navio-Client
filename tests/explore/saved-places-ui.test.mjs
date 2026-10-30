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
  if (url.endsWith('/next/image.js')) return { format: 'module', shortCircuit: true,
    source: 'import { createElement } from "react"; export default function Image({ unoptimized, ...props }) { return createElement("img", props); }' };
  return next(url, context);
}`), import.meta.url);
const { DaySavedPlacesPicker } = await import(
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
const { TripPlaceCard } = await import(
  "../../app/feature/planner/planId/_components/block/items/trip-place-card.tsx"
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

test("an Explore-saved stop renders the same complete card as a map-added stop", () => {
  const store = createStore();
  store.set(plannerReadOnlyAtom, true);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const place = {
    id: "visit", type: "place", placeId: "GOOGLE:ChITestTemple",
    name: "Temple", address: "10 Temple Road", lat: 13.7, lng: 100.5,
    imageUrl: "https://maps.googleapis.com/test-temple-photo.jpg", rating: 4.7,
    reviewCount: 1200, description: "Buddhist temple", placeType: "hindu_temple",
  };
  queryClient.setQueryData(["place-details", "GOOGLE", "ChITestTemple"], {
    ...place, id: place.placeId, provider: "GOOGLE", providerPlaceId: "ChITestTemple",
    primaryType: place.placeType, openingHours: "Open 24 hours",
  });
  const render = (item) => renderToStaticMarkup(React.createElement(QueryClientProvider, { client: queryClient },
    React.createElement(Provider, { store }, React.createElement(TripPlaceCard, {
      blockId: "day", blockDate: "2026-10-16", blockColorId: "teal", position: 2, item,
    }))));
  const saved = { id: place.id, type: "place", placeId: place.placeId, name: place.name, address: "", lat: place.lat, lng: place.lng };
  const before = structuredClone(saved);
  assert.equal(render(saved), render(place));
  assert.deepEqual(saved, before, "provider display fallback must not mutate saved trip data");
  queryClient.clear();
});

test("provider details never replace the card's existing saved name or visual fields", () => {
  const store = createStore();
  store.set(plannerReadOnlyAtom, true);
  const queryClient = new QueryClient();
  queryClient.setQueryData(["place-details", "GOOGLE", "ChITestTemple"], {
    id: "GOOGLE:ChITestTemple", name: "Provider name", address: "Provider address",
    description: "Provider category", rating: 4.9, reviewCount: 999,
  });
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client: queryClient },
    React.createElement(Provider, { store }, React.createElement(TripPlaceCard, {
      blockId: "day", blockDate: "2026-10-16", blockColorId: "teal", position: 2,
      item: { id: "visit", type: "place", placeId: "GOOGLE:ChITestTemple", name: "My saved name",
        address: "Saved address", description: "Saved category", rating: 3.5, reviewCount: 123, lat: 1, lng: 2 },
    }))));
  assert.match(html, /My saved name/);
  assert.match(html, /Saved address/);
  assert.match(html, /3\.5/);
  assert.doesNotMatch(html, /Provider address|Provider name|Provider category/);
  queryClient.clear();
});

test("the day picker offers saved places and is hidden when read-only", () => {
  const store = createStore();
  store.set(tripBlocksAtom, blocks);
  const render = (component) =>
    renderToStaticMarkup(React.createElement(Provider, { store }, component));
  assert.match(
    render(React.createElement(DaySavedPlacesPicker, { dayId: "day" })),
    /Saved places \(1\)/,
  );
  store.set(plannerReadOnlyAtom, true);
  assert.equal(
    render(React.createElement(DaySavedPlacesPicker, { dayId: "day" })),
    "",
  );
});

test("My List renders a saved place once, inside the list it was added to", () => {
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
  assert.ok(html.indexOf("Edit list title: Ideas") < html.indexOf(">Garden<"), "the place renders in its own list");
  assert.doesNotMatch(html, /Saved across your lists/);
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
