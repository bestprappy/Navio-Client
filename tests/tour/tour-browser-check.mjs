// Fixture-backed check of the first-time tours. Run against an isolated Next dev server started with
// AUTH_SECRET=tour-ui-test-secret-not-for-production and an unreachable NAVIO_API_BASE_URL:
//   NAVIO_PLAYWRIGHT_MODULE=file:///.../playwright-core/index.mjs node tests/tour/tour-browser-check.mjs
// Every API the pages call is mocked in the browser; no real service is contacted.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { encode } from "next-auth/jwt";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");

const origin = process.env.NAVIO_TOUR_TEST_ORIGIN ?? "http://localhost:3121";
const secret = process.env.NAVIO_TOUR_TEST_SECRET ?? "tour-ui-test-secret-not-for-production";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "only run against a local server");
const output = process.env.NAVIO_TOUR_TEST_OUTPUT ?? fileURLToPath(new URL("./.output", import.meta.url));
await mkdir(output, { recursive: true });
const shot = (name) => `${output}/${name}.png`;

const USER_ID = "00000000-0000-4000-8000-0000000000b7";
const TRIP_ID = "3f0b6a52-6c1e-4a7b-9d2e-1c4f5a6b7c8d";
const STORAGE_KEY = `navio:tours:v1:${USER_ID}`;
const now = new Date("2026-11-13T09:00:00.000Z").toISOString();
const trip = {
  id: TRIP_ID, displayName: "Bangkok weekend", title: "Bangkok weekend", destinationCity: "Bangkok", destinationRegion: null,
  destinationCountryCode: "TH", startDate: "2026-12-05", endDate: "2026-12-07", destinationId: "bangkok", destinationName: "Bangkok",
  destinationLat: 13.7563, destinationLng: 100.5018, destinationCountry: "Thailand", visibility: "PRIVATE", createdAt: now, updatedAt: now,
};
let plannerVersion = 1;
const snapshot = () => ({ blocks: [], budget: { currency: "THB", amount: 0, expenses: [] }, version: plannerVersion, savedAt: now });

// Map tiles and SDKs are irrelevant to the tours and need keys this server does not have.
const IGNORED_ERRORS = /mapbox|google|maps|access token|WebGL|Failed to fetch/i;

async function open(browser, { path, signedIn = true, theme = "light", width = 1280, height = 900, reducedMotion = "no-preference", storage = {} }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, reducedMotion });
  if (signedIn) {
    const claims = Buffer.from(JSON.stringify({ sub: USER_ID, realm_access: { roles: [] } })).toString("base64url");
    const cookie = await encode({
      secret, salt: "authjs.session-token",
      token: { sub: USER_ID, name: "Pim Traveler", email: "pim@example.com", roles: [], accessToken: `test.${claims}.test`, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 },
    });
    await context.addCookies([{ name: "authjs.session-token", value: cookie, url: origin, httpOnly: true, sameSite: "Lax" }]);
  }
  await context.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) window.localStorage.setItem(key, value);
  }, storage);

  await context.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname.startsWith("/api/auth/")) return route.fallback();
    return route.fulfill({ status: 404, json: { status: 404, message: "Not mocked in the tour check" } });
  });
  await context.route("**/api/trips?**", (route) => route.fulfill({ json: { content: [trip], totalElements: 1 } }));
  await context.route(`**/api/trips/${TRIP_ID}`, (route) => route.fulfill({ json: trip }));
  await context.route(`**/api/trips/${TRIP_ID}/planner`, (route) => {
    if (route.request().method() === "PUT") plannerVersion += 1;
    return route.fulfill({ json: snapshot() });
  });
  await context.route("**/api/users/me**", (route) => route.fulfill({ json: { id: USER_ID, displayName: "Pim Traveler", email: "pim@example.com", status: "active", roles: [], preferences: {} } }));
  await context.route(/mapbox\.com|googleapis\.com|gstatic\.com/, (route) => route.abort());

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => { if (!IGNORED_ERRORS.test(error.message)) errors.push(error.message); });
  await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
  return { context, page, errors };
}

const popover = (page) => page.locator("#driver-popover-content");
const title = (page) => page.locator("#driver-popover-title");
const activeTarget = (page) => page.evaluate(() => document.querySelector(".driver-active-element")?.getAttribute("data-tour") ?? null);
const records = (page) => page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}"), STORAGE_KEY);
const noPageOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

async function walk(page, { screenshotAt = {} } = {}) {
  const steps = [];
  for (let guard = 0; guard < 12; guard += 1) {
    await title(page).waitFor();
    await page.waitForTimeout(450);
    const count = await page.locator(".navio-tour-count").textContent();
    steps.push({ title: (await title(page).textContent())?.trim(), target: await activeTarget(page), count });
    if (screenshotAt[steps.length]) await page.screenshot({ path: shot(screenshotAt[steps.length]) });
    const next = page.locator(".driver-popover-next-btn");
    const isLast = (await next.textContent())?.trim() === "Done";
    await next.click();
    if (isLast) break;
  }
  await popover(page).waitFor({ state: "detached" });
  return steps;
}

const browser = await chromium.launch({ channel: process.env.NAVIO_BROWSER_CHANNEL ?? "chrome", headless: true });
const results = [];
const only = process.env.NAVIO_TOUR_ONLY;
const check = async (name, run) => {
  if (only && !name.includes(only)) return;
  try { await run(); results.push(`ok   ${name}`); }
  catch (error) { results.push(`FAIL ${name}: ${error.message.slice(0, 900)}`); process.exitCode = 1; }
};

try {
  await check("dashboard: auto-starts once, walks every step, records completion", async () => {
    const { context, page, errors } = await open(browser, { path: "/dashboard" });
    await title(page).waitFor({ timeout: 15000 });
    assert.equal(await title(page).textContent(), "Welcome to Navio");
    assert.ok(await page.evaluate(() => document.activeElement?.closest("#driver-popover-content") !== null), "focus did not move into the tip");
    assert.equal(await page.locator(".driver-popover-prev-btn").isVisible(), false, "Back shown on the first step");
    const steps = await walk(page, { screenshotAt: { 1: "dashboard-welcome-light", 2: "dashboard-new-trip-light", 5: "dashboard-sidebar-light" } });
    console.log("dashboard steps:", steps.map((s) => `${s.count} ${s.title} [${s.target ?? "centred"}]`).join(" | "));
    assert.deepEqual(steps.map((s) => s.target), [null, "dashboard.new-trip", "dashboard.trips", "dashboard.explore", "sidebar.trips", "sidebar.notifications", "help"]);
    assert.equal(steps.at(-1).count, `${steps.length} of ${steps.length}`);
    const saved = await records(page);
    assert.equal(saved.dashboard?.status, "completed");
    assert.equal(saved.dashboard?.version, 1);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Show tips for this page/ }).waitFor();
    await page.waitForTimeout(2500);
    assert.equal(await popover(page).count(), 0, "tour auto-started again after completion");
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check("dashboard: Show tips replays, Escape dismisses and focus returns to the button", async () => {
    const { context, page, errors } = await open(browser, { path: "/dashboard", storage: { [STORAGE_KEY]: JSON.stringify({ dashboard: { status: "completed", version: 1, at: now } }) } });
    const help = page.getByRole("button", { name: "Show tips for this page: Dashboard" });
    await help.waitFor();
    await page.waitForTimeout(1500);
    assert.equal(await popover(page).count(), 0);
    await help.click();
    await title(page).waitFor();
    // Pressed straight away, during the opening animation: the tour must still end cleanly.
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement?.closest("#driver-popover-content") !== null), "Tab escaped the tip");
    await page.keyboard.press("Escape");
    await popover(page).waitFor({ state: "detached" });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-tour")), "help");
    assert.equal((await records(page)).dashboard?.status, "dismissed");
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check("dashboard: clicking the close button ends the tour and records it as dismissed", async () => {
    const { context, page, errors } = await open(browser, { path: "/dashboard" });
    await title(page).waitFor({ timeout: 15000 });
    await page.waitForTimeout(450);
    await page.locator(".driver-popover-next-btn").click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Close tips" }).click();
    await popover(page).waitFor({ state: "detached", timeout: 3000 });
    assert.equal(await page.locator(".driver-overlay").count(), 0, "overlay stayed after closing");
    assert.equal((await records(page)).dashboard?.status, "dismissed");
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check("dashboard: leaving mid-tour records nothing so it is offered again", async () => {
    const { context, page } = await open(browser, { path: "/dashboard" });
    await title(page).waitFor({ timeout: 15000 });
    await page.locator(".driver-popover-next-btn").click();
    // The overlay blocks pointer input, so follow a nav link the way a keyboard or script would.
    await page.evaluate(() => document.querySelector("a[href='/explore']")?.click());
    await page.waitForURL("**/explore**");
    await page.waitForTimeout(500);
    assert.equal((await records(page)).dashboard, undefined);
    assert.equal(await popover(page).count(), 0, "dashboard tip survived navigation");
    await context.close();
  });

  await check("dashboard: dark theme screenshot", async () => {
    const { context, page } = await open(browser, { path: "/dashboard", theme: "dark" });
    await title(page).waitFor({ timeout: 15000 });
    await page.locator(".driver-popover-next-btn").click();
    await page.locator(".driver-popover-next-btn").click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: shot("dashboard-trips-dark") });
    await context.close();
  });

  await check("planner: owner gets the tour once the trip loads, every target found", async () => {
    const { context, page, errors } = await open(browser, { path: `/planner/${TRIP_ID}`, theme: "dark" });
    await title(page).waitFor({ timeout: 30000 });
    assert.equal(await title(page).textContent(), "This is your trip planner");
    const steps = await walk(page, { screenshotAt: { 2: "planner-my-list-dark", 4: "planner-day-options-dark", 7: "planner-trip-options-dark" } });
    console.log("planner steps:", steps.map((s) => `${s.count} ${s.title} [${s.target ?? "centred"}]`).join(" | "));
    assert.deepEqual(steps.map((s) => s.target), [null, "planner.my-list", "planner.itinerary", "planner.day-options", "planner.garage", "planner.budget", "planner.trip-options", "help"]);
    assert.equal((await records(page)).planner?.status, "completed");
    // Next's dev overlay lists console errors from the mocked 404 APIs; it is present with or without a tour.
    const dialogs = await page.locator("[role='dialog']:not(#driver-popover-content):not([data-nextjs-dialog])").evaluateAll((nodes) => nodes.map((node) => node.outerHTML.slice(0, 160)));
    assert.deepEqual(dialogs, [], "the tour opened a dialog");
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check("planner: the spotlight follows its control when content above grows or the panel scrolls", async () => {
    const { context, page, errors } = await open(browser, { path: `/planner/${TRIP_ID}` });
    await title(page).waitFor({ timeout: 30000 });
    await page.waitForTimeout(450);
    await page.locator(".driver-popover-next-btn").click();
    await page.waitForFunction(() => document.querySelector(".driver-active-element")?.getAttribute("data-tour") === "planner.my-list");
    await page.waitForTimeout(700);
    // Popover sits below the header; this gap is what must survive layout changes.
    const gap = () => page.evaluate(() => {
      const target = document.querySelector("[data-tour='planner.my-list']").getBoundingClientRect();
      const tip = document.querySelector("#driver-popover-content").getBoundingClientRect();
      return Math.round(tip.top - target.bottom);
    });
    const before = await gap();
    // The garage loading its battery charts late, simulated: 140px appears above My List.
    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.style.height = "140px";
      document.querySelector("[data-tour='planner.my-list']").closest("section").before(spacer);
    });
    await page.waitForTimeout(300);
    const afterGrowth = await gap();
    await page.evaluate(() => document.getElementById("planner-scroll-panel").scrollBy(0, 90));
    await page.waitForTimeout(300);
    const afterScroll = await gap();
    assert.ok(Math.abs(afterGrowth - before) <= 3, `tip drifted ${afterGrowth - before}px after content grew`);
    assert.ok(Math.abs(afterScroll - before) <= 3, `tip drifted ${afterScroll - before}px after the panel scrolled`);
    await page.screenshot({ path: shot("planner-follows-layout-light") });
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check("planner: does not auto-start while the itinerary table covers the plan", async () => {
    const { context, page } = await open(browser, { path: `/planner/${TRIP_ID}?view=table` });
    await page.waitForTimeout(6000);
    assert.equal(await popover(page).count(), 0);
    await context.close();
  });

  await check("planner: on a phone showing the map it waits; Show tips switches back to the itinerary", async () => {
    const { context, page } = await open(browser, { path: `/planner/${TRIP_ID}`, width: 390, height: 844, storage: { "navio:planner-mobile-view": JSON.stringify("map") } });
    await page.getByRole("button", { name: "Map", pressed: true }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(4000);
    assert.equal(await popover(page).count(), 0, "tour started over the map");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("button", { name: /Show tips for this page/ }).click();
    await title(page).waitFor();
    assert.equal(await page.getByRole("button", { name: "Itinerary", pressed: true }).count(), 1);
    await page.locator(".driver-popover-next-btn").click();
    await page.waitForTimeout(600);
    const box = await popover(page).boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 390, `tip overflows the phone: ${JSON.stringify(box)}`);
    assert.ok(await noPageOverflow(page));
    await page.screenshot({ path: shot("planner-phone-light") });
    await context.close();
  });

  await check("community: guests get the tour at 375px without overflow", async () => {
    const { context, page, errors } = await open(browser, { path: "/community", signedIn: false, width: 375, height: 812 });
    await title(page).waitFor({ timeout: 15000 });
    const steps = await walk(page, { screenshotAt: { 1: "community-welcome-phone", 3: "community-search-phone" } });
    console.log("community phone steps:", steps.map((s) => `${s.count} ${s.title} [${s.target ?? "centred"}]`).join(" | "));
    assert.ok(steps.filter((s) => s.target).length >= 3);
    assert.ok(await noPageOverflow(page));
    const guestRecords = await page.evaluate(() => JSON.parse(window.localStorage.getItem("navio:tours:v1:guest") ?? "{}"));
    assert.equal(guestRecords.community?.status, "completed");
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check("community: desktop dark walks sections, search, create, groups and help", async () => {
    const { context, page, errors } = await open(browser, { path: "/community", theme: "dark" });
    await title(page).waitFor({ timeout: 15000 });
    const steps = await walk(page, { screenshotAt: { 2: "community-sections-dark", 6: "community-popular-dark" } });
    console.log("community desktop steps:", steps.map((s) => `${s.count} ${s.title} [${s.target ?? "centred"}]`).join(" | "));
    assert.deepEqual(steps.map((s) => s.target), [null, "community.sections", "community.search", "community.create-post", "community.create-group", "community.popular-groups", "help"]);
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check("reduced motion: no entrance animation, pulse or smooth glide", async () => {
    const { context, page } = await open(browser, { path: "/community", reducedMotion: "reduce" });
    await title(page).waitFor({ timeout: 15000 });
    await page.locator(".driver-popover-next-btn").click();
    await page.waitForTimeout(300);
    const animation = await popover(page).evaluate((element) => getComputedStyle(element).animationName);
    assert.equal(animation, "none");
    assert.equal(await page.locator(".navio-tour-pulse").count(), 0);
    await context.close();
  });
} finally {
  await browser.close();
  console.log(results.join("\n"));
  console.log(`screenshots: ${output}`);
}
