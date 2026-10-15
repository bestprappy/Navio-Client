import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { discoveryPageSchema, discoveryItemSchema, safeExternalUrl, discoverPlaces, readPlace } = await import("../../app/feature/explore/places/places-api.ts");
const { placesRequest } = await import("../../app/feature/explore/places/places-request.ts");
const place = { providerPlaceId: "abc", name: "Garden", location: { lat: 13.7, lng: 100.5 }, rating: null, openingHours: null };

test("reader accepts absent optional details and retains photo attribution", () => {
  const item = discoveryItemSchema.parse({ place, reason: null, photoGoogleMapsUri: "https://maps.google.com/photo", photoAttributions: [{ displayName: "Photographer", uri: "https://example.com/author", photoUri: "https://example.com/avatar" }] });
  assert.equal(item.reason, null);
  assert.equal(item.photoAttributions[0].displayName, "Photographer");
  assert.equal(item.photoGoogleMapsUri, "https://maps.google.com/photo");
});
test("malformed location and response shapes cannot render cards", () => {
  assert.equal(discoveryItemSchema.safeParse({ place: { ...place, location: { lat: 100, lng: 0 } } }).success, false);
  assert.equal(discoveryPageSchema.safeParse({ items: [], hasMore: "yes", seasonal: null }).success, false);
});
test("provider links reject executable and invalid schemes", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,hello", "file:///etc/passwd", "invalid"]) assert.equal(safeExternalUrl(value), undefined);
  assert.equal(safeExternalUrl("https://example.com"), "https://example.com/");
});
test("discovery sends bounded page size, destination, month, and cancellation signal", async t => {
  const abort = new AbortController();
  t.mock.method(globalThis, "fetch", async (input, init) => {
    const url = new URL(input, "http://localhost");
    assert.equal(url.searchParams.get("size"), "4");
    assert.equal(url.searchParams.get("destination"), "Bangkok");
    assert.equal(url.searchParams.get("month"), "11");
    assert.equal(url.searchParams.get("collection"), "scenic");
    assert.equal(init.cache, "no-store");
    assert.equal(init.signal, abort.signal);
    return Response.json({ items: [], hasMore: false, seasonal: null });
  });
  await discoverPlaces({ name: "Bangkok", lat: 13.7, lng: 100.5 }, 11, "scenic", 0, abort.signal);
});
test("provider failures remain errors rather than fabricated empty results", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 429 }));
  await assert.rejects(discoverPlaces({ name: "Bangkok", lat: 13.7, lng: 100.5 }, 11, "popular", 0), /busy/);
  await assert.rejects(readPlace("abc"), /could not be loaded/);
});
test("request queue limits concurrency and removes cancelled requests before fetch", async t => {
  let concurrent = 0;
  let maximum = 0;
  const release = [];
  const fetched = [];
  t.mock.method(globalThis, "fetch", url => {
    fetched.push(url); concurrent++; maximum = Math.max(maximum, concurrent);
    return new Promise(resolve => release.push(() => { concurrent--; resolve(new Response()); }));
  });
  const first = placesRequest("/first");
  const second = placesRequest("/second");
  const abort = new AbortController();
  const cancelled = placesRequest("/cancelled", abort.signal);
  const rejection = assert.rejects(cancelled, error => error.name === "AbortError");
  const fourth = placesRequest("/fourth");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetched.length, 2);
  abort.abort(); await rejection;
  release.shift()(); await first;
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(fetched, ["/first", "/second", "/fourth"]);
  release.shift()(); release.shift()(); await Promise.all([second,fourth]);
  assert.equal(maximum, 2);
});
