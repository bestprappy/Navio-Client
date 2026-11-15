// Places Release 2 browser check: the explicit Google Maps search is the only provider path,
// starts only on a press, counts calls exactly, degrades gracefully and keeps Google identities.
// Run against a dev server started with NEXT_PUBLIC_PLACES_PROVIDER_SEARCH=true. All APIs are
// intercepted: no real provider request and no account write is made.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3131";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const shots = resolve(process.env.NAVIO_SCREENSHOT_DIR ?? "output/places-release-2");
await mkdir(shots, { recursive: true });

const user = { id: "22222222-2222-4222-8222-222222222222", name: "Test traveler", roles: [] };
const place = (n) => ({
  providerPlaceId: `ChIJ-ramen-${n}`,
  name: `Ramen house ${n}`,
  address: `${n} Chome, Shinjuku, Tokyo, Japan`,
  lat: 35.69 + n / 1000,
  lng: 139.7,
  category: "Ramen restaurant",
  primaryType: "ramen_restaurant",
  countryCode: "JP",
  city: "Tokyo",
  googleMapsUri: `https://maps.google.com/?cid=${n}`,
});

async function scenario(browser, { name, viewport, scheme, signedIn = true, providerStatus = 200, run }) {
  const context = await browser.newContext({ viewport, colorScheme: scheme, reducedMotion: "reduce" });
  const providerCalls = [];
  const saves = [];
  const errors = [];
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/auth/session")
      return route.fulfill({ json: signedIn ? { user, expires: "2099-01-01T00:00:00.000Z" } : {} });
    if (path === "/api/geo/place-searches") {
      providerCalls.push(url.search);
      if (providerStatus !== 200)
        return route.fulfill({
          status: providerStatus,
          json: { status: providerStatus, error: "You have used today's searches beyond the catalogue. Try again tomorrow." },
        });
      const second = url.searchParams.get("cursor") === "2.tok";
      return route.fulfill({
        json: {
          items: second ? [place(5), place(6)] : [place(1), place(2), place(3), place(4), { ...place(9), providerPlaceId: "NAVIO:spoof" }],
          cursor: second ? null : "2.tok",
          page: second ? 2 : 1,
          maxPages: 3,
          source: "GOOGLE",
        },
      });
    }
    if (path.startsWith("/api/geo/places/") && !path.startsWith("/api/geo/places/explore"))
      return route.fulfill({ status: 599, json: { error: "unexpected provider path in this check" } });
    if (path === "/api/users/me/saved/states" && request.method() === "POST")
      return route.fulfill({
        json: request.postDataJSON().identities.map((identity) => ({ identity, id: null, saved: false, sources: [] })),
      });
    if (path === "/api/users/me/saved/places" && request.method() === "POST") {
      const body = request.postDataJSON();
      saves.push(body);
      return route.fulfill({
        json: { id: "33333333-3333-4333-8333-333333333333", type: "PLACE", identity: `google:${body.providerPlaceId}`, name: body.name, address: body.address, providerPlaceId: body.providerPlaceId, lat: body.lat, lng: body.lng, country: body.country, city: body.city, category: body.category, authorName: null, dayCount: null, savedAt: "2026-11-16T00:00:00Z", openedAt: null, deletedAt: null, sources: [] },
      });
    }
    if (path.startsWith("/api/geo/places/explore")) return route.continue();
    if (path.includes("palette")) return route.fulfill({ json: [] });
    return route.fulfill({ json: { items: [], content: [], unreadCount: 0, totalElements: 0, states: {} } });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await run({ page, providerCalls, saves });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `${name}: no horizontal overflow (${overflow}px)`);
    assert.deepEqual(errors, [], `${name}: no page errors`);
    console.log(`ok ${name}`);
  } finally {
    await context.close();
  }
}

async function openSearch(page, query, country = "") {
  const params = new URLSearchParams({ tab: "places", placesQuery: query });
  if (country) params.set("country", country);
  await page.goto(`${origin}/explore?${params}`, { waitUntil: "networkidle", timeout: 180000 });
  await page.getByRole("heading", { name: "Navio's catalogue ends here" }).waitFor({ timeout: 120000 });
}

const browser = await chromium.launch({ channel: process.env.NAVIO_BROWSER_CHANNEL ?? "msedge", headless: true });
try {
  await scenario(browser, {
    name: "desktop light: explicit search, paging, identity and attribution",
    viewport: { width: 1440, height: 1000 },
    scheme: "light",
    run: async ({ page, providerCalls, saves }) => {
      await openSearch(page, "ramen", "JP");
      const button = page.getByRole("button", { name: /Search Google Maps for/ });
      await button.hover();
      await button.focus();
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(500);
      assert.equal(providerCalls.length, 0, "load, scroll, hover and focus make no provider call");
      await page.screenshot({ path: resolve(shots, "desktop-light-prompt.png"), fullPage: true });
      await page.keyboard.press("Enter");
      await page.getByRole("heading", { name: "Results from Google Maps" }).waitFor();
      await page.getByRole("list", { name: "Google Maps results" }).waitFor();
      assert.equal(providerCalls.length, 1, "one press makes exactly one request");
      assert.match(providerCalls[0], /query=ramen&country=JP&cursor=$/);
      assert.equal(await page.getByRole("list", { name: "Google Maps results" }).getByRole("listitem").count(), 4, "catalogue-ID spoof dropped");
      assert.equal(await page.getByRole("img", { name: "Google Maps" }).first().isVisible(), true, "Google Maps attribution shown");
      const link = page.getByRole("link", { name: /Ramen house 1/ });
      assert.equal(await link.getAttribute("href"), "https://maps.google.com/?cid=1");
      assert.equal(await link.getAttribute("target"), "_blank");
      await page.getByRole("button", { name: "Show more from Google Maps" }).click();
      await page.getByText("Ramen house 6").waitFor();
      assert.equal(providerCalls.length, 2);
      assert.match(providerCalls[1], /cursor=2\.tok/);
      await page.getByText("No more Google Maps results.").waitFor();
      const card = page.getByRole("listitem").filter({ hasText: "Ramen house 2" });
      await card.getByRole("button", { name: "Save place" }).click();
      await page.getByText("Saved to your collection.").waitFor();
      assert.equal(saves.length, 1);
      assert.equal(saves[0].providerPlaceId, "ChIJ-ramen-2", "Google identity saved unchanged");
      assert.equal(saves[0].name, "Ramen house 2");
      assert.equal(providerCalls.length, 2, "saving makes no provider call");
      await page.screenshot({ path: resolve(shots, "desktop-light-results.png"), fullPage: true });
      await page.goto(`${origin}/explore?tab=places&placesQuery=sushi&country=JP`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Navio's catalogue ends here" }).waitFor();
      assert.equal(providerCalls.length, 2, "a new search starts unrequested");
    },
  });

  await scenario(browser, {
    name: "mobile dark: catalogue search keeps local results and the panel stays idle",
    viewport: { width: 390, height: 844 },
    scheme: "dark",
    run: async ({ page, providerCalls }) => {
      await openSearch(page, "museum", "TH");
      await page.waitForTimeout(800);
      assert.equal(providerCalls.length, 0);
      await page.screenshot({ path: resolve(shots, "mobile-dark-prompt.png"), fullPage: true });
      await page.getByRole("button", { name: /Search Google Maps for/ }).click();
      await page.getByRole("list", { name: "Google Maps results" }).waitFor();
      assert.equal(providerCalls.length, 1);
      await page.screenshot({ path: resolve(shots, "mobile-dark-results.png"), fullPage: true });
    },
  });

  await scenario(browser, {
    name: "limit reached: one request, readable direction, no retry, catalogue untouched",
    viewport: { width: 1024, height: 900 },
    scheme: "light",
    providerStatus: 429,
    run: async ({ page, providerCalls }) => {
      await openSearch(page, "museum", "TH");
      await page.getByRole("button", { name: /Search Google Maps for/ }).click();
      const alert = page.getByRole("alert").filter({ hasText: "today's searches" });
      await alert.waitFor();
      assert.equal(await alert.getByRole("button", { name: "Try again" }).count(), 0, "no retry offered for a limit");
      await page.waitForTimeout(1000);
      assert.equal(providerCalls.length, 1, "no automatic retry");
      await page.screenshot({ path: resolve(shots, "limit-reached.png"), fullPage: true });
    },
  });

  await scenario(browser, {
    name: "outage: retry is offered and each retry is one request",
    viewport: { width: 1024, height: 900 },
    scheme: "dark",
    providerStatus: 503,
    run: async ({ page, providerCalls }) => {
      await openSearch(page, "ramen", "JP");
      await page.getByRole("button", { name: /Search Google Maps for/ }).click();
      const alert = page.getByRole("alert").filter({ hasText: "unavailable right now" });
      await alert.waitFor();
      await alert.getByRole("button", { name: "Try again" }).click();
      await page.waitForTimeout(800);
      assert.equal(providerCalls.length, 2);
    },
  });

  await scenario(browser, {
    name: "signed out: the press asks to sign in and makes no request",
    viewport: { width: 1024, height: 900 },
    scheme: "light",
    signedIn: false,
    run: async ({ page, providerCalls }) => {
      await openSearch(page, "ramen", "JP");
      await page.getByRole("button", { name: /Search Google Maps for/ }).click();
      await page.waitForTimeout(800);
      assert.equal(providerCalls.length, 0);
      await page.screenshot({ path: resolve(shots, "signed-out.png"), fullPage: false });
    },
  });
} finally {
  await browser.close();
}
