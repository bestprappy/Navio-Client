import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup as renderMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { destinationCountryCover } = await import("../../app/feature/explore/_components/shared-plans/plan-cover.data.ts");
const { tripCoverUrl } = await import("../../app/feature/planner/_components/trip-cover-api.ts");
const { isTripResponse } = await import("../../app/feature/planner/_components/planner-api.ts");
const { TripHero } = await import("../../app/feature/planner/planId/_components/overview/trip-hero.tsx");

const TRIP_ID = "10000000-0000-4000-8000-000000000001";
const COVER_ID = "20000000-0000-4000-8000-000000000001";
const render = (props) => renderMarkup(
  React.createElement(QueryClientProvider, { client: new QueryClient() }, React.createElement(TripHero, props)),
);
const trip = {
  id: TRIP_ID, displayName: null, title: "Taiwan", destinationCity: null, destinationRegion: null,
  destinationCountryCode: "TW", startDate: "2026-12-22", endDate: "2026-12-26", destinationId: "GOOGLE:x",
  destinationName: "Taiwan", destinationLat: 23.7, destinationLng: 121, destinationCountry: "Taiwan",
  visibility: "PRIVATE", createdAt: "2026-11-13T00:00:00Z", updatedAt: "2026-11-13T00:00:00Z",
};

test("a country-only destination gets that country's photo", () => {
  assert.equal(destinationCountryCover({ country: "Taiwan", name: "Taiwan" })?.src, "/images/plan-covers/taipei.webp");
});

test("a destination whose only clue is its name still finds the country photo", () => {
  assert.equal(destinationCountryCover({ name: "Taiwan" })?.src, "/images/plan-covers/taipei.webp");
});

test("the city's own photo wins over another photo from the same country", () => {
  assert.equal(destinationCountryCover({ city: "Chiang Mai", country: "Thailand" })?.src, "/images/plan-covers/chiang-mai.webp");
});

test("an unlisted city falls back to a photo from its own country, never another country's city", () => {
  const cover = destinationCountryCover({ city: "Paris", country: "United States" });
  assert.equal(cover?.country, "United States");
  assert.equal(destinationCountryCover({ city: "Pattaya", country: "Thailand" })?.country, "Thailand");
});

test("a country without a bundled photo gets none", () => {
  assert.equal(destinationCountryCover({ city: "Kuala Lumpur", country: "Malaysia" }), undefined);
  assert.equal(destinationCountryCover({}), undefined);
});

test("the cover url is versioned by cover id and absent without one", () => {
  assert.equal(tripCoverUrl(TRIP_ID, COVER_ID), `/api/trips/${TRIP_ID}/cover?v=${COVER_ID}`);
  assert.equal(tripCoverUrl(TRIP_ID, null), null);
  assert.equal(tripCoverUrl(TRIP_ID, undefined), null);
});

test("trip responses from servers with and without covers are both accepted", () => {
  assert.equal(isTripResponse(trip), true);
  assert.equal(isTripResponse({ ...trip, coverMediaId: null }), true);
  assert.equal(isTripResponse({ ...trip, coverMediaId: COVER_ID }), true);
  assert.equal(isTripResponse({ ...trip, coverMediaId: 7 }), false);
});

test("an uploaded cover replaces the destination photo", () => {
  const html = render({ planId: TRIP_ID, destinationName: "Taiwan", destinationCountry: "Taiwan", coverMediaId: COVER_ID });
  assert.match(html, new RegExp(`src="/api/trips/${TRIP_ID}/cover\\?v=${COVER_ID}"`));
  assert.doesNotMatch(html, /taipei/);
  assert.match(html, /aria-label="Edit cover photo"/);
});

test("without an upload the banner shows the credited destination photo", () => {
  const html = render({ planId: TRIP_ID, destinationName: "Taiwan", destinationCountry: "Taiwan" });
  assert.match(html, /taipei\.webp/);
  assert.match(html, /Photo: AngMoKio/);
  assert.match(html, /CC BY-SA 3\.0/);
  assert.doesNotMatch(html, /\/cover\?v=/);
});

test("a destination without a photo falls back to the brand gradient only", () => {
  const html = render({ planId: TRIP_ID, destinationName: "Kuala Lumpur", destinationCountry: "Malaysia" });
  assert.match(html, /var\(--brand-gradient\)/);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /Photo:/);
});

test("the edit button is hidden for read-only banners and unsaved trips", () => {
  assert.doesNotMatch(render({ planId: TRIP_ID, destinationName: "Taiwan", readOnly: true }), /Edit cover photo/);
  assert.doesNotMatch(render({ planId: "new", destinationName: "Taiwan" }), /Edit cover photo/);
  assert.doesNotMatch(render({ destinationName: "Taiwan" }), /Edit cover photo/);
});
