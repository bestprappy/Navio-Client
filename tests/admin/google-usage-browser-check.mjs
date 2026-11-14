// Fixture-backed Google usage panel check. Run against an isolated Next dev server started with
// AUTH_SECRET=admin-ui-test-secret-not-for-production and no Google key. No real API is called.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { encode } from "next-auth/jwt";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");

const origin = process.env.NAVIO_ADMIN_TEST_ORIGIN ?? "http://localhost:3113";
const secret = process.env.NAVIO_ADMIN_TEST_SECRET ?? "admin-ui-test-secret-not-for-production";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const output = process.env.NAVIO_ADMIN_TEST_OUTPUT ?? fileURLToPath(new URL("./.output/google-usage", import.meta.url));
await mkdir(output, { recursive: true });
const shot = (name) => `${output}/${name}.png`;

const report = (overrides = {}) => ({
  monthStart: "2026-11-01T07:00:00Z",
  resetsAt: "2026-12-01T08:00:00Z",
  asOf: "2026-11-10T05:00:00Z",
  limitsEnforced: true,
  placesDiscoveryEnabled: false,
  meters: [
    { meter: "PLACES_AUTOCOMPLETE", used: 1240, limit: 9500, lastCountedAt: null },
    { meter: "PLACE_DETAILS", used: 288, limit: 950, lastCountedAt: null },
    { meter: "PLACE_PHOTOS", used: 612, limit: 950, lastCountedAt: null },
    { meter: "PLACES_TEXT_SEARCH", used: 41, limit: 950, lastCountedAt: null },
    { meter: "PLACES_NEARBY_SEARCH", used: 96, limit: 950, lastCountedAt: null },
    { meter: "ROUTES", used: 318, limit: 4750, lastCountedAt: null },
  ],
  ...overrides,
});

async function open(browser, { theme = "light", width = 1280, height = 900, roles = ["ADMIN"], respond }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", colorScheme: theme });
  const sub = "00000000-0000-4000-8000-0000000000a1";
  const claims = Buffer.from(JSON.stringify({ sub, realm_access: { roles } })).toString("base64url");
  const cookie = await encode({ secret, salt: "authjs.session-token", token: { sub, name: "Admin", email: "admin@example.com", roles, accessToken: `test.${claims}.test`, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
  await context.addCookies([{ name: "authjs.session-token", value: cookie, url: origin, httpOnly: true, sameSite: "Lax" }]);
  await context.route("**/api/trips**", (route) => route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0 } }));
  await context.route("**/api/users/**", (route) => route.fulfill({ json: { id: sub, displayName: "Admin", email: "admin@example.com", status: "active", roles, preferences: {} } }));
  await context.route("**/api/palette-colors", (route) => route.fulfill({ json: [] }));
  const calls = { usage: 0, google: 0, overrides: [] };
  await context.route("**/api/admin/google-usage", (route) => { calls.usage += 1; return respond(route, calls.usage); });
  await context.route("**/api/admin/google-usage/limit-override", (route) => {
    const { ignoreLimits } = route.request().postDataJSON();
    calls.overrides.push({ method: route.request().method(), ignoreLimits });
    return route.fulfill({ json: report({
      limitsIgnoredSince: ignoreLimits ? "2026-11-10T05:00:00Z" : null,
      meters: [{ meter: "PLACE_DETAILS", used: 1020, limit: 950, lastCountedAt: null }, { meter: "ROUTES", used: 318, limit: 4750, lastCountedAt: null }],
    }) });
  });
  await context.route(/googleapis\.com/, (route) => { calls.google += 1; return route.abort(); });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.log(`[console error, ${width}px ${theme}] ${message.text().slice(0, 300)}`);
  });
  await page.goto(`${origin}/admin/google-usage`, { waitUntil: "domcontentloaded" });
  return { context, page, errors, calls };
}

const ok = (overrides) => (route) => route.fulfill({ json: report(overrides) });
const noPageOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const browser = await chromium.launch({ channel: process.env.NAVIO_BROWSER_CHANNEL ?? "chrome", headless: true });
const results = [];
const check = async (name, run) => {
  try { await run(); results.push(`ok   ${name}`); }
  catch (error) { results.push(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
};

try {
  await check("desktop: fullest first, today line straight through every bar", async () => {
    const { context, page, errors, calls } = await open(browser, { respond: ok() });
    await page.getByText("Place photos is closest to its limit, at 612 of 950.").waitFor();
    const names = await page.locator("li [data-slot=progress]").evaluateAll((bars) => bars.map((bar) => bar.getAttribute("aria-label")));
    assert.equal(names[0], "Place photos");
    assert.equal(names.length, 6);
    const lefts = await page.locator("li [data-slot=progress] + span").evaluateAll((lines) => lines.map((line) => Math.round(line.getBoundingClientRect().left)));
    assert.equal(new Set(lefts).size, 1, `today line wandered: ${lefts}`);
    assert.equal(await page.getByRole("progressbar", { name: "Place photos" }).getAttribute("aria-valuetext"), "612 of 950 used");
    assert.ok(await noPageOverflow(page));
    assert.deepEqual(errors, []);
    assert.equal(calls.google, 0);
    await page.screenshot({ path: shot("desktop-light"), fullPage: true });
    await context.close();
  });

  await check("sidebar links here, console links open Google Cloud in a new tab", async () => {
    const { context, page } = await open(browser, { respond: ok() });
    await page.getByText("closest to its limit").waitFor();
    const nav = page.getByRole("link", { name: "Google usage" }).first();
    assert.equal(await nav.getAttribute("href"), "/admin/google-usage");
    for (const [name, path] of [["Quotas", "google/maps-apis/quotas"], ["API traffic", "google/maps-apis/metrics"], ["Billing", "billing/linkedaccount"]]) {
      const link = page.getByRole("link", { name });
      assert.equal(await link.getAttribute("href"), `https://console.cloud.google.com/${path}?project=navio-495916`);
      assert.equal(await link.getAttribute("target"), "_blank");
      assert.equal(await link.getAttribute("rel"), "noreferrer");
    }
    await context.close();
  });

  await check("dark theme renders", async () => {
    const { context, page, errors } = await open(browser, { theme: "dark", respond: ok() });
    await page.getByText("closest to its limit").waitFor();
    assert.deepEqual(errors, []);
    await page.screenshot({ path: shot("desktop-dark"), fullPage: true });
    await context.close();
  });

  await check("phone width: nothing overflows the page", async () => {
    const { context, page, errors } = await open(browser, { width: 375, height: 800, respond: ok() });
    await page.getByText("closest to its limit").waitFor();
    assert.ok(await noPageOverflow(page));
    assert.deepEqual(errors, []);
    await page.screenshot({ path: shot("phone"), fullPage: true });
    await context.close();
  });

  await check("a reached limit is stated in words, not only in color", async () => {
    const { context, page } = await open(browser, { respond: ok({
      placesDiscoveryEnabled: true,
      meters: [{ meter: "PLACE_PHOTOS", used: 950, limit: 950, lastCountedAt: null }, { meter: "ROUTES", used: 3900, limit: 4750, lastCountedAt: null }],
    }) });
    await page.getByText("Place photos has reached its limit, so places show without photos.").waitFor();
    await page.getByText("Limit reached").waitFor();
    await page.getByText("Nearly used").waitFor();
    assert.equal(await page.getByText("Places discovery is off").count(), 0);
    await page.screenshot({ path: shot("limits-reached"), fullPage: true });
    await context.close();
  });

  await check("switched-off limits are called out and no meter reading is claimed", async () => {
    const { context, page } = await open(browser, { respond: ok({
      limitsEnforced: false,
      meters: [{ meter: "PLACE_PHOTOS", used: 950, limit: 950, lastCountedAt: null }],
    }) });
    await page.getByText("Limits are switched off.").waitFor();
    await page.getByText("Google calls are not being counted right now.").waitFor();
    assert.equal(await page.getByText("has reached its limit").count(), 0);
    assert.equal(await page.getByText("Limit reached").count(), 0);
    assert.equal(await page.getByText("At the limit,").count(), 0);
    await page.screenshot({ path: shot("limits-off"), fullPage: true });
    await context.close();
  });

  await check("a failed load shows the problem and retries, never zeroes", async () => {
    // Fails until the retry: React's development double mount can use up a first request.
    let failing = true;
    const { context, page, calls } = await open(browser, {
      respond: (route) => failing
        ? route.fulfill({ status: 503, json: { status: 503, message: "Mobility data is temporarily unavailable" } })
        : route.fulfill({ json: report() }),
    });
    await page.getByRole("button", { name: "Try again" }).waitFor();
    assert.equal(await page.getByRole("progressbar").count(), 0);
    await page.screenshot({ path: shot("error"), fullPage: true });
    failing = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await page.getByText("closest to its limit").waitFor();
    assert.ok(calls.usage >= 2);
    await context.close();
  });

  await check("keyboard reaches Refresh and the console links with a visible focus ring", async () => {
    const { context, page } = await open(browser, { respond: ok() });
    await page.getByText("closest to its limit").waitFor();
    const quotas = page.getByRole("link", { name: "Quotas" });
    await quotas.focus();
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.textContent ?? "");
    assert.match(focused, /API traffic/);
    await page.screenshot({ path: shot("focus"), clip: { x: 0, y: 0, width: 1280, height: 900 } });
    await context.close();
  });

  await check("ignoring limits asks first, then says calls continue and are billed; restoring is one click", async () => {
    const { context, page, errors, calls } = await open(browser, { respond: ok({
      meters: [{ meter: "PLACE_DETAILS", used: 950, limit: 950, lastCountedAt: null }, { meter: "ROUTES", used: 318, limit: 4750, lastCountedAt: null }],
    }) });
    await page.getByText("Place details has reached its limit").waitFor();
    await page.getByRole("button", { name: "Ignore limits this month" }).click();
    const dialog = page.getByRole("dialog", { name: "Ignore Google limits until 1 Dec 2026?" });
    await dialog.waitFor();
    await page.screenshot({ path: shot("override-confirm") });
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.deepEqual(calls.overrides, []);

    await page.getByRole("button", { name: "Ignore limits this month" }).click();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.deepEqual(calls.overrides, []);

    await page.getByRole("button", { name: "Ignore limits this month" }).click();
    await dialog.getByRole("button", { name: "Ignore limits", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.getByText("Place details is past its free allowance, at 1,020 of 950. Calls continue and are billed.").waitFor();
    await page.getByText("Past free allowance, billed").waitFor();
    await page.getByRole("status").filter({ hasText: "Limits are ignored until" }).waitFor();
    assert.equal(await page.getByText("At the limit,").count(), 0);
    assert.deepEqual(calls.overrides, [{ method: "PUT", ignoreLimits: true }]);
    assert.ok(await noPageOverflow(page));
    await page.screenshot({ path: shot("override-on"), fullPage: true });

    await page.getByRole("button", { name: "Restore limits" }).click();
    await page.getByRole("button", { name: "Ignore limits this month" }).waitFor();
    assert.deepEqual(calls.overrides.at(-1), { method: "PUT", ignoreLimits: false });
    assert.deepEqual(errors, []);
    assert.equal(calls.google, 0);
    await context.close();
  });

  await check("ignored limits read well in dark theme and at phone width", async () => {
    const ignored = ok({ limitsIgnoredSince: "2026-11-10T05:00:00Z", meters: [{ meter: "PLACE_DETAILS", used: 1020, limit: 950, lastCountedAt: null }] });
    for (const [theme, width] of [["dark", 1280], ["light", 375]]) {
      const { context, page, errors } = await open(browser, { theme, width, height: 900, respond: ignored });
      await page.getByRole("button", { name: "Restore limits" }).waitFor();
      assert.ok(await noPageOverflow(page));
      assert.deepEqual(errors, []);
      await page.screenshot({ path: shot(`override-on-${theme}-${width}`), fullPage: true });
      await context.close();
    }
  });

  await check("a failed override keeps the dialog open and says why", async () => {
    const { context, page } = await open(browser, { respond: ok() });
    await context.route("**/api/admin/google-usage/limit-override", (route) =>
      route.fulfill({ status: 503, json: { status: 503, message: "Mobility data is temporarily unavailable" } }));
    await page.getByRole("button", { name: "Ignore limits this month" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Ignore limits", exact: true }).click();
    await dialog.getByRole("alert").waitFor();
    assert.equal(await page.getByRole("button", { name: "Restore limits" }).count(), 0);
    await page.screenshot({ path: shot("override-failed") });
    await context.close();
  });

  await check("switched-off limits hide the override, since nothing would stop anyway", async () => {
    const { context, page } = await open(browser, { respond: ok({ limitsEnforced: false }) });
    await page.getByText("Limits are switched off.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Ignore limits this month" }).count(), 0);
    await context.close();
  });

  await check("a moderator sees a refusal and the page never asks for usage", async () => {
    const { context, page, calls } = await open(browser, { roles: ["MODERATOR"], respond: ok() });
    await page.getByText("Only administrators can view Google usage.").waitFor();
    assert.equal(calls.usage, 0);
    assert.equal(await page.getByRole("link", { name: "Google usage" }).count(), 0);
    await context.close();
  });
} finally {
  await browser.close();
  console.log(results.join("\n"));
}
