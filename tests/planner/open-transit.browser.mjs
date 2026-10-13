// Isolated account/trip writes; every directions response comes from the real configured backend.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";
import { planId, userId, day as defaultDay, towerDay, trip, account, capabilities } from "./open-transit/data.ts";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
// Default to the actual Next -> gateway -> Mobility path. An explicit override diagnoses a private instance.
const mobility = process.env.NAVIO_TEST_MOBILITY_ORIGIN;
const day = process.env.NAVIO_TEST_TOKYO_ROUTE === "tower-shinjuku" ? towerDay : defaultDay;
const output = process.env.NAVIO_TEST_OUTPUT ?? "C:/Users/User/.codex/tmp/navio-open-transit-20261013/browser";
await mkdir(output, { recursive: true });
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("The local Auth.js secret is required for this isolated fixture");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.setDefaultTimeout(30000);
const page = await context.newPage();
const errors = [], routes = [], writes = [], apiPaths = [];
let snapshot = { version: 1, savedAt: new Date().toISOString(), blocks: [day], capabilities,
  budget: { currency: "JPY", amount: 0, expenses: [] } };
const cookie = await encode({ secret, salt: "authjs.session-token", token: { sub: userId, name: account.displayName,
  accessToken: mobility ? "synthetic-test-only" : undefined,
  accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
await context.addCookies([{ name: "authjs.session-token", value: cookie, url: base, httpOnly: true, sameSite: "Lax" }]);
await context.addInitScript(() => localStorage.setItem("theme", "dark"));
page.on("pageerror", error => errors.push(error.message));
page.on("response", async response => {
  if (!mobility && new URL(response.url()).pathname === "/api/routes/directions") {
    try {
      assert.equal(response.status(), 200);
      routes.push(await response.json());
    } catch (error) { errors.push(error.message); }
  }
});
await context.route(`${base}/api/**`, async route => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  apiPaths.push(path);
  if (path.startsWith("/api/auth/")) return route.continue();
  if (path === "/api/routes/directions") {
    if (!mobility) return route.continue();
    const response = await context.request.post(`${mobility}/v1/routes/directions`, { data: request.postDataJSON(), timeout: 30000 });
    assert.equal(response.status(), 200);
    const body = await response.json();
    routes.push(body);
    return route.fulfill({ json: body });
  }
  if (path === `/api/trips/${planId}/planner`) {
    if (request.method() === "PUT") {
      writes.push(path);
      snapshot = { ...snapshot, ...request.postDataJSON(), version: snapshot.version + 1, savedAt: new Date().toISOString() };
    }
    return route.fulfill({ json: snapshot });
  }
  if (["PUT", "POST", "PATCH", "DELETE"].includes(request.method())) throw new Error(`Unexpected account write: ${path}`);
  if (path === `/api/trips/${planId}`) return route.fulfill({ json: { ...trip, createdAt: snapshot.savedAt, updatedAt: snapshot.savedAt } });
  if (path === "/api/trips") return route.fulfill({ json: { content: [trip], totalElements: 1 } });
  if (path === "/api/users/me") return route.fulfill({ json: account });
  if (path === "/api/users/me/vehicles" || path === "/api/users/me/places") return route.fulfill({ json: [] });
  if (path.startsWith("/api/geo/places/")) return route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: "fixture",
    name: "Tokyo", location: { lat: 35.6938, lng: 139.7034 }, openingHours: {} } });
  return route.fulfill({ json: { items: [], content: [], totalElements: 0, totalPages: 0 } });
});

try {
  await page.goto(`${base}/planner/${planId}?destinationName=Tokyo&from=2026-10-13&to=2026-10-13&lat=35.6938&lng=139.7034`,
    { waitUntil: "domcontentloaded", timeout: 120000 });
  const trigger = page.getByRole("button", { name: /Travel mode:.*Show routes/ }).first();
  await trigger.waitFor({ timeout: 90000 });
  await trigger.click();
  const panel = page.getByRole("region", { name: `Routes from ${day.items[0].name} to ${day.items[1].name}`, exact: true });
  await panel.getByRole("radio").first().waitFor({ timeout: 60000 });
  await panel.getByRole("radio").first().check();
  await panel.locator('[data-slot="accordion-trigger"]').first().click();
  await panel.getByRole("list", { name: "Journey directions" }).waitFor();
  assert.ok(await panel.getByText(/Toei|Tokyo Metro|JR East/).count());
  await page.getByRole("link", { name: "Route data: OpenStreetMap contributors. Opens in a new tab." }).waitFor();
  await panel.screenshot({ path: `${output}/tokyo-dark.png` });
  await panel.getByRole("button", { name: "Use this route", exact: true }).click();
  await page.waitForTimeout(1500);
  const saved = snapshot.blocks[0].items[1].arrivalRouteKey;
  assert.ok(saved?.startsWith("v1:"), "Confirmed line/station sequence was not saved");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Travel mode:.*Show routes/ }).first().click();
  await panel.getByRole("button", { name: "In plan", exact: true }).waitFor({ timeout: 60000 });
  assert.equal(snapshot.blocks[0].items[1].arrivalRouteKey, saved);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await panel.screenshot({ path: `${output}/tokyo-mobile.png` });
  await page.evaluate(() => { document.documentElement.classList.remove("dark"); document.documentElement.classList.add("light"); });
  await panel.screenshot({ path: `${output}/tokyo-light.png` });
  assert.equal(errors.length, 0, errors.join("\n"));
  assert.ok(routes.some(response => response.segments.some(segment => segment.status === "routed" && segment.journeys?.some(journey => journey.provider === "OTP"))));
  await writeFile(`${output}/results.json`, JSON.stringify({ status: "passed", apiResponses: routes.length, interceptedWrites: writes.length,
    directionsPath: mobility ? "explicit private instance" : "actual Next/gateway/Mobility",
    from: day.items[0].name, to: day.items[1].name,
    checks: ["live Tokyo GTFS routing", "line/station directions", "OSM route attribution", "save/reload", "light/dark/mobile"] }, null, 2));
  console.log(`Live Tokyo browser check passed: ${output}`);
} catch (error) {
  await writeFile(`${output}/failure-details.json`, JSON.stringify({ url: page.url(), errors, apiPaths, routes: routes.length,
    body: (await page.locator("body").innerText().catch(() => "unavailable")).slice(0, 2000) }, null, 2));
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
  throw error;
} finally {
  await context.close();
  await browser.close();
}
