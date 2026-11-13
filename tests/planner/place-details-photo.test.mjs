// Run: node --experimental-transform-types --test tests/planner/place-details-photo.test.mjs
import assert from "node:assert/strict";
import { register } from "node:module";
import { afterEach, test } from "node:test";
import { QueryClient } from "@tanstack/react-query";

register(new URL("../support/typescript-loader.mjs", import.meta.url));

const { fetchPlaceDetail } = await import("../../app/feature/planner/planId/_components/place/place-api.ts");
const { placeDetailsQueryKey, reuseCachedDetailsWithPhoto } = await import(
  "../../app/feature/planner/planId/_components/place/use-place-details.ts"
);

const reference = { provider: "GOOGLE", providerPlaceId: "ChITest" };
const detail = { provider: "GOOGLE", providerPlaceId: "ChITest", name: "Temple", location: { lat: 1, lng: 2 }, openingHours: {} };
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function captureUrl() {
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify(detail), { status: 200 });
  };
  return urls;
}

test("a lookup without a photo tells the server not to buy one", async () => {
  const urls = captureUrl();
  await fetchPlaceDetail("ChITest", "GOOGLE", { includePhoto: false });
  assert.match(urls[0], /includePhoto=false/);
});

test("a lookup that wants a photo, or does not say, leaves the server's default alone", async () => {
  const urls = captureUrl();
  await fetchPlaceDetail("ChITest", "GOOGLE");
  await fetchPlaceDetail("ChITest", "GOOGLE", { includePhoto: true });
  assert.doesNotMatch(urls[0], /includePhoto/);
  assert.doesNotMatch(urls[1], /includePhoto/);
});

test("lookups with and without a photo are cached apart", () => {
  assert.deepEqual(placeDetailsQueryKey(reference, true), ["place-details", "GOOGLE", "ChITest"]);
  assert.deepEqual(placeDetailsQueryKey(reference, false), ["place-details", "GOOGLE", "ChITest", "without-photo"]);
});

test("a lookup without a photo reuses a cached one with a photo, keeping its age", () => {
  const client = new QueryClient();
  const cached = { id: "GOOGLE:ChITest", imageUrl: "https://photo" };
  client.setQueryData(placeDetailsQueryKey(reference, true), cached, { updatedAt: 1234 });

  const reused = reuseCachedDetailsWithPhoto(client, reference);

  assert.equal(reused.initialData(), cached);
  assert.equal(reused.initialDataUpdatedAt(), 1234);
  client.clear();
});

test("nothing cached with a photo means the lookup still goes to the server", () => {
  const client = new QueryClient();
  client.setQueryData(placeDetailsQueryKey(reference, false), { id: "no photo" });

  const reused = reuseCachedDetailsWithPhoto(client, reference);

  assert.equal(reused.initialData(), undefined);
  assert.equal(reused.initialDataUpdatedAt(), undefined);
  client.clear();
});
