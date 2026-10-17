// Run: node --experimental-transform-types --test tests/community/plan-attachment.test.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    // App sources import siblings without an extension; node_modules must stay untouched.
    const fromAppSource = context.parentURL?.includes("/app/") && !context.parentURL.includes("/node_modules/");
    if (fromAppSource && specifier.startsWith("./") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const {
  ExplorePlansError,
  explorePlanSummaryQueryKey,
  EXPLORE_SHARED_PLANS_QUERY_KEY,
  fetchExplorePlanSummary,
  isShareToken,
} = await import("../../app/feature/explore/_components/shared-plans/explore-plans-api.ts");
const { fetchExplorePlanSummaryFromGateway } = await import(
  "../../app/feature/explore/_components/shared-plans/explore-plans-server.ts"
);
const { GET: summaryRoute } = await import("../../app/api/shared-plans/[token]/summary/route.ts");

const TOKEN = "Abcdefghijklmnopqrstuvwxyz0123456789_-ABCDE";
const CARD = {
  token: TOKEN,
  title: "Songkran road trip",
  authorName: "Kanya S.",
  destinationCity: "Bangkok",
  destinationCountry: "Thailand",
  dayCount: 2,
  placeCount: 3,
  chargerCount: 1,
  coverImageUrl: null,
  highlights: ["Wat Arun"],
  days: [{ stops: ["place", "charger"] }],
  listedAt: "2026-09-20T10:00:00Z",
};

const originalFetch = globalThis.fetch;
const originalError = console.error;
const originalBaseUrl = process.env.NAVIO_API_BASE_URL;
afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalError;
  process.env.NAVIO_API_BASE_URL = originalBaseUrl;
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("only real share tokens count as plan references", () => {
  assert.equal(isShareToken(TOKEN), true);
  for (const value of ["200", "trip-bangkok-food-loop", `${TOKEN}A`, TOKEN.slice(1), "../../v1/trips/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", null, undefined, ""]) {
    assert.equal(isShareToken(value), false, String(value));
  }
});

test("single plan cards live under the feed key so publish changes refresh them", () => {
  assert.deepEqual(explorePlanSummaryQueryKey(TOKEN).slice(0, EXPLORE_SHARED_PLANS_QUERY_KEY.length), [
    ...EXPLORE_SHARED_PLANS_QUERY_KEY,
  ]);
});

test("a listed plan's card is read through this origin's summary route", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `/api/shared-plans/${TOKEN}/summary`);
    assert.equal(options.cache, "no-store");
    return json(CARD);
  };
  const plan = await fetchExplorePlanSummary(TOKEN);
  assert.equal(plan?.title, "Songkran road trip");
  assert.equal(plan?.chargerCount, 1);
});

test("a plan that is no longer listed reads as null, not as an error", async () => {
  globalThis.fetch = async () => json({ message: "This plan is not listed on Explore" }, 404);
  assert.equal(await fetchExplorePlanSummary(TOKEN), null);
});

test("a failing or malformed card is an error the attachment can retry", async () => {
  globalThis.fetch = async () => json({ message: "down" }, 502);
  await assert.rejects(fetchExplorePlanSummary(TOKEN), (error) => error instanceof ExplorePlansError && error.status === 502);

  globalThis.fetch = async () => json({ token: "" });
  await assert.rejects(fetchExplorePlanSummary(TOKEN), (error) => error instanceof ExplorePlansError && error.status === 502);
});

test("the server never forwards something that is not a share token", async () => {
  process.env.NAVIO_API_BASE_URL = "http://gateway.test";
  globalThis.fetch = async () => assert.fail("must not reach the gateway");
  assert.deepEqual(await fetchExplorePlanSummaryFromGateway("200"), { status: "not-listed" });
  assert.deepEqual(await fetchExplorePlanSummaryFromGateway("../trips"), { status: "not-listed" });
});

test("the server reads the card anonymously from the gateway", async () => {
  process.env.NAVIO_API_BASE_URL = "http://gateway.test";
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), `http://gateway.test/v1/shared-plans/${TOKEN}/summary`);
    assert.equal(new Headers(options.headers).has("Authorization"), false);
    return json(CARD);
  };
  const result = await fetchExplorePlanSummaryFromGateway(TOKEN);
  assert.equal(result.status, "ok");
  assert.equal(result.plan.token, TOKEN);
});

test("the summary route answers 404 for unlisted plans and 502 when the gateway fails", async () => {
  process.env.NAVIO_API_BASE_URL = "http://gateway.test";
  console.error = () => {};
  const call = (token) => summaryRoute(new Request("http://localhost/api"), { params: Promise.resolve({ token }) });

  globalThis.fetch = async () => json({ status: 404 }, 404);
  let response = await call(TOKEN);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("Cache-Control"), "no-store");

  globalThis.fetch = async () => json({ status: 500 }, 500);
  response = await call(TOKEN);
  assert.equal(response.status, 502);

  globalThis.fetch = async () => json(CARD);
  response = await call(TOKEN);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).title, "Songkran road trip");
});
