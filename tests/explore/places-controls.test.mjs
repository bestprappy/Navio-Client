import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { DiscoveryExpand, PlacesDiscovery, PlaceFeed } = await import(
  "../../app/feature/explore/places/places-discovery.tsx"
);
test("empty fallback seasonal pages retain their continuation action", () => {
  const state = {
    country: "US",
    query: "",
    interests: [],
    types: [],
    time: "season:summer",
  };
  const client = new QueryClient();
  client.setQueryData(["places-explore", state, "seasonal", ""], {
    pages: [
      {
        items: [],
        recommendationIds: [],
        cursor: "more",
        mode: "discovery",
        seasonalNotice: "Navio seasonal inspiration",
        seasonalSources: [],
      },
    ],
    pageParams: [""],
  });
  const html = renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(PlaceFeed, {
        state,
        collection: "seasonal",
        destination: "",
        context: "",
      }),
    ),
  );
  assert.match(html, /Load more places/);
  assert.match(html, /More places are available to check/);
});
test("an untouched Places visit shows discovery sections instead of a destination gate", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      AppRouterContext.Provider,
      { value: { push() {}, replace() {} } },
      React.createElement(
        SearchParamsContext.Provider,
        { value: new URLSearchParams() },
        React.createElement(
          SessionProvider,
          { session: null },
          React.createElement(
            QueryClientProvider,
            { client: new QueryClient() },
            React.createElement(PlacesDiscovery),
          ),
        ),
      ),
    ),
  );
  assert.match(html, /Popular places/);
  assert.match(html, /Hidden gems/);
  assert.match(html, /Scenic spots/);
  assert.doesNotMatch(html, /Where would you like to go\?/);
});
const { PlaceSearchControls } = await import(
  "../../app/feature/explore/places/search-controls.tsx"
);
test("a sparse but pageable discovery section exposes expansion", () => {
  const html = renderToStaticMarkup(
    React.createElement(DiscoveryExpand, {
      count: 3,
      hasMore: true,
      onExpand: () => {},
    }),
  );
  assert.match(html, /View selection/);
  assert.equal(
    renderToStaticMarkup(
      React.createElement(DiscoveryExpand, {
        count: 3,
        hasMore: false,
        onExpand: () => {},
      }),
    ),
    "",
  );
});
test("toolbar labels are ordered, time groups are explicit, and selections stay visible", () => {
  const state = {
    country: "JP",
    query: "Osaka",
    interests: ["scenic"],
    types: ["restaurant"],
    time: "season:autumn",
  };
  const html = renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      React.createElement(PlaceSearchControls, {
        state,
        onChange: () => {},
        onPlace: () => {},
      }),
    ),
  );
  const labels = [
    ">Country<",
    ">Search places<",
    ">Interests &amp; place types<",
    ">Month &amp; season<",
  ].map((label) => html.indexOf(label));
  assert.ok(labels.every((i) => i >= 0));
  assert.deepEqual(
    [...labels].sort((a, b) => a - b),
    labels,
  );
  assert.match(html, /optgroup label="Months"/);
  assert.match(html, /optgroup label="Seasons/);
  assert.match(html, /Any time/);
  assert.match(html, /Interest: Scenic spots/);
  assert.match(html, /Type: Restaurant/);
  assert.match(html, /aria-label="Country: Japan"/);
});
