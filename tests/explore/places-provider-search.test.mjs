import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as api from "../../app/feature/explore/places/provider-search-api.ts";
import * as catalogue from "../../app/feature/explore/places/catalogue.ts";
import { placeIdentity, savedPlaceDestination } from "../../app/feature/saved/library-model.ts";
import { isPublicPlannerRequest } from "../../app/api/_lib/public-planner-request.ts";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const google = {
  providerPlaceId: "ChIJ-museum",
  name: "Museum of Siam",
  address: "Bangkok",
  lat: 13.744,
  lng: 100.494,
  category: "Museum",
  primaryType: "museum",
  countryCode: "TH",
  city: "Bangkok",
  googleMapsUri: "https://maps.google.com/?cid=1",
};

function bffRoute() {
  const calls = [];
  const exports = {};
  const source = read("app/api/geo/place-searches/route.ts");
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    {
      exports,
      URL,
      URLSearchParams,
      Response,
      require: () => ({
        proxyMobilityRequest: (_request, path) => {
          calls.push(path);
          return new Response("{}", { status: 200 });
        },
      }),
    },
  );
  return { GET: exports.GET, calls };
}

test("the paid search is off unless the deployment opts in", () => {
  assert.equal(api.providerSearchEnabled, false);
});

test("queries outside 2 to 120 characters never qualify for a provider search", () => {
  assert.equal(api.canSearchProvider(" a "), false);
  assert.equal(api.canSearchProvider("x".repeat(121)), false);
  assert.equal(api.canSearchProvider("ramen"), true);
});

test("provider pages keep Google identities and drop catalogue claims and malformed items", () => {
  const page = api.parseProviderPage({
    items: [google, { ...google, providerPlaceId: "NAVIO:jim-thompson-house" }, { ...google, providerPlaceId: "NAVIO%3Ajim" }, { name: "no id" }],
    cursor: "2.tok",
    page: 1,
    maxPages: 3,
    source: "GOOGLE",
  });
  assert.deepEqual(page.items.map((item) => item.providerPlaceId), ["ChIJ-museum"]);
  assert.throws(() => api.parseProviderPage({ items: [], cursor: null, page: 1, maxPages: 3, source: "CATALOGUE" }));
});

test("a saved Google result keeps its own identity, distinct from every catalogue identity", () => {
  const bookmark = api.providerBookmark(google);
  assert.equal(bookmark.providerPlaceId, "ChIJ-museum");
  const identity = placeIdentity(bookmark.providerPlaceId, google.lat, google.lng);
  assert.equal(identity, "google:ChIJ-museum");
  const catalogueIdentities = catalogue.cataloguePlaces.map((p) => placeIdentity(p.id, p.lat, p.lng));
  assert.ok(catalogueIdentities.every((id) => id.startsWith("NAVIO:")));
  assert.ok(!catalogueIdentities.includes(identity));
});

test("Google Maps links use the result's own https link or the free public search URL", () => {
  assert.equal(api.providerMapsUrl(google), "https://maps.google.com/?cid=1");
  const fallback = new URL(api.providerMapsUrl({ ...google, googleMapsUri: "javascript:alert(1)" }));
  assert.equal(fallback.origin, "https://www.google.com");
  assert.equal(fallback.searchParams.get("query_place_id"), "ChIJ-museum");
});

test("the BFF rejects invalid input without any upstream call and forwards valid input once", async () => {
  const route = bffRoute();
  for (const query of ["?query=a", `?query=${"x".repeat(121)}`, "?query=ramen&country=THA", `?query=ramen&cursor=${"x".repeat(2101)}`]) {
    const response = await route.GET(new Request(`http://localhost/api/geo/place-searches${query}`));
    assert.equal(response.status, 400, query);
  }
  assert.deepEqual(route.calls, []);
  const ok = await route.GET(new Request("http://localhost/api/geo/place-searches?query=%20ramen%20&country=th&cursor=2.tok"));
  assert.equal(ok.status, 200);
  assert.deepEqual(route.calls, ["/v1/geo/place-searches?query=ramen&country=TH&cursor=2.tok"]);
});

test("the paid route is never treated as guest-readable", () => {
  assert.equal(isPublicPlannerRequest("GET", "/v1/geo/place-searches"), false);
  assert.equal(isPublicPlannerRequest("GET", "/v1/geo/place-searches?query=ramen"), false);
});

test("each failure maps to a direction and the client never retries on its own", async () => {
  const original = globalThis.fetch;
  const cases = [
    [401, {}, "Sign in to search Google Maps."],
    [429, { error: "You have used today's searches beyond the catalogue. Try again tomorrow." }, "You have used today's searches beyond the catalogue. Try again tomorrow."],
    [503, {}, "Google Maps search is unavailable right now."],
    [500, {}, "Google Maps results could not be loaded."],
  ];
  try {
    for (const [status, body, message] of cases) {
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        return new Response(JSON.stringify(body), { status });
      };
      await assert.rejects(api.searchProviderPlaces("ramen", "", "", new AbortController().signal), (error) => {
        assert.equal(error.status, status);
        assert.equal(error.message, message);
        return true;
      });
      assert.equal(calls, 1, `status ${status}`);
    }
  } finally {
    globalThis.fetch = original;
  }
});

test("a busy instance is retryable but a used-up limit is not", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("{}", { status: 429, headers: { "Retry-After": "1" } });
    await assert.rejects(api.searchProviderPlaces("ramen", "", "", new AbortController().signal), (error) => {
      assert.equal(error.retryable, true);
      assert.equal(error.message, "Google Maps search is busy. Try again in a moment.");
      return true;
    });
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Used up." }), { status: 429 });
    await assert.rejects(api.searchProviderPlaces("ramen", "", "", new AbortController().signal), (error) => error.retryable === false);
  } finally {
    globalThis.fetch = original;
  }
});

test("a successful search sends exactly one request with the trimmed query", async () => {
  const original = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ items: [google], cursor: null, page: 1, maxPages: 3, source: "GOOGLE" }), { status: 200 });
  };
  try {
    const page = await api.searchProviderPlaces("  ramen ", "JP", "", new AbortController().signal);
    assert.equal(page.items.length, 1);
    assert.deepEqual(urls, ["/api/geo/place-searches?query=ramen&country=JP&cursor="]);
  } finally {
    globalThis.fetch = original;
  }
});

test("saved places open locally only for catalogue identities", () => {
  const navio = catalogue.cataloguePlaces[0];
  assert.deepEqual(savedPlaceDestination({ providerPlaceId: navio.id, name: navio.name, lat: navio.lat, lng: navio.lng }), {
    href: `/explore/places/${encodeURIComponent(navio.id)}`,
    external: false,
  });
  for (const id of ["ChIJ-museum", "GOOGLE:ChIJ-museum"]) {
    const target = savedPlaceDestination({ providerPlaceId: id, name: "Museum", lat: 1, lng: 2 });
    assert.equal(target.external, true);
    assert.equal(new URL(target.href).searchParams.get("query_place_id"), "ChIJ-museum");
  }
  assert.equal(
    savedPlaceDestination({ providerPlaceId: "MAPBOX:x", name: "Pin", lat: 1, lng: 2 }).href,
    "https://www.google.com/maps/search/?api=1&query=1,2",
  );
});

test("only an explicit press can start the provider query, with no retries or background refetch", () => {
  const panel = read("app/feature/explore/places/provider-search.tsx");
  assert.match(panel, /enabled: requested,/);
  assert.match(panel, /retry: false/);
  assert.match(panel, /refetchOnWindowFocus: false/);
  assert.match(panel, /refetchOnReconnect: false/);
  assert.match(panel, /requireAuth\(\(\) => setRequested\(true\)\)/);
  assert.doesNotMatch(panel, /useEffect/);
  const discovery = read("app/feature/explore/places/places-discovery.tsx");
  assert.match(discovery, /providerSearchEnabled && \(\s*<ProviderSearch/);
  assert.match(discovery, /key={`provider-\$\{state\.query\.trim\(\)\}-\$\{state\.country\}`}/);
  for (const path of ["app/api/geo/places/explore/route.ts", "app/api/geo/places/explore/suggestions/route.ts"])
    assert.doesNotMatch(read(path), /proxyMobilityRequest|place-searches/, path);
});
