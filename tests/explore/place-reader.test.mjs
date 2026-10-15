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
const { PlaceReader, readerMapOptions } = await import(
  "../../app/feature/explore/places/place-reader.tsx"
);
const { PlaceReaderViewport } = await import(
  "../../app/feature/explore/places/place-reader-viewport.tsx"
);
const { discoveryItemSchema } = await import(
  "../../app/feature/explore/places/places-api.ts"
);
const raw = {
  place: {
    providerPlaceId: "garden",
    name: "Quiet Garden",
    address: "Tokyo",
    location: { lat: 35.7, lng: 139.7 },
    category: "Garden",
    description: "A garden with an extensive botanical collection.",
    openingHours: { weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM"] },
  },
  photos: [
    {
      url: "https://example.com/one.jpg",
      attributions: [{ displayName: "Photographer" }],
      googleMapsUri: "https://maps.google.com/photo",
    },
    {
      url: "https://example.com/two.jpg",
      attributions: [{ displayName: "Second author" }],
    },
  ],
};

test("viewport shell contains page overflow and lets content use remaining navbar height", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      PlaceReaderViewport,
      { navigation: React.createElement("nav", null, "Navigation") },
      React.createElement("p", null, "Reader"),
    ),
  );
  assert.match(html, /h-dvh/);
  assert.match(html, /overflow-hidden/);
  assert.match(html, /min-h-0 flex-1/);
});
test("reader leads with essentials, then real additional photos and visit details inside the drawer", () => {
  const client = new QueryClient();
  client.setQueryData(
    ["discovery-place", "garden"],
    discoveryItemSchema.parse(raw),
  );
  const html = renderToStaticMarkup(
    React.createElement(
      AppRouterContext.Provider,
      { value: { back() {} } },
      React.createElement(
        SearchParamsContext.Provider,
        { value: new URLSearchParams() },
        React.createElement(
          SessionProvider,
          { session: null },
          React.createElement(
            QueryClientProvider,
            { client },
            React.createElement(PlaceReader, { placeId: "garden" }),
          ),
        ),
      ),
    ),
  );
  assert.ok(html.indexOf("Quiet Garden") < html.indexOf("one.jpg"));
  assert.match(html, /Second author/);
  assert.match(html, /Monday/);
  assert.match(html, /9:00 AM – 5:00 PM/);
  assert.match(html, /overflow-y-auto/);
  assert.doesNotMatch(html, /100dvh-4rem/);
  client.clear();
});
test("older single-photo payloads remain valid", () => {
  const item = discoveryItemSchema.parse({ place: raw.place });
  assert.deepEqual(item.photos, []);
});
test("reader wheel zoom does not require Ctrl and retains zoom buttons", () => {
  assert.equal(readerMapOptions.gestureHandling, "greedy");
  assert.equal(readerMapOptions.scrollwheel, true);
  assert.equal(readerMapOptions.zoomControl, true);
});
