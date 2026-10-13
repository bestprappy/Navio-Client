// Isolated browser account: every planner/account API is intercepted; no backend writes.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";
import { origin, destination, journeyDay, railRoute, scheduledJourneys } from "./travel-options/data.ts";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
const output = process.env.NAVIO_TEST_OUTPUT ?? "C:/Users/User/.codex/tmp/navio-transit-alternatives-20261013/browser";
const planId = "a1000000-0000-4000-8000-000000000051";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.setDefaultTimeout(20000);
const page = await context.newPage();
const errors = [], requests = [], writes = [];
let railMissing = false, cyclingMissing = false;
const stamp = new Date().toISOString();
let snapshot = { version: 1, savedAt: stamp, blocks: [journeyDay], budget: { currency: "THB", amount: 0, expenses: [] }, capabilities: ["leg-travel-mode-v1", "cycling-legs-v1", "transit-preferences-v1", "transit-route-choice-v1", "trip-energy-v1", "trip-garage-v1", "observed-soc-v1", "day-destinations", "day-anchors", "charge-targets", "precise-charging-v1"] };
const trip = { id: planId, displayName: "Bangkok transit test", title: "Bangkok transit test", destinationId: "bangkok", destinationName: "Bangkok", destinationCountry: "Thailand", destinationLat: 13.75, destinationLng: 100.53, startDate: "2026-10-13", endDate: "2026-10-13", visibility: "PRIVATE", createdAt: stamp, updatedAt: stamp };
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("The local development Auth.js secret is required for this isolated browser test.");
const cookie = await encode({ secret, salt: "authjs.session-token", token: { sub: "22222222-2222-4222-8222-222222222222", name: "Test traveller", accessToken: "synthetic-test-only", accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
await context.addCookies([{ name: "authjs.session-token", value: cookie, url: base, httpOnly: true, sameSite: "Lax" }]);
page.on("pageerror", (error) => errors.push(error.message));
await context.addInitScript(() => { localStorage.setItem("theme", "dark"); });
await context.route(`${base}/api/**`, async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (["PUT", "PATCH", "DELETE"].includes(request.method())) writes.push(path);
  if (path.startsWith("/api/auth/")) return route.continue();
  if (path === `/api/trips/${planId}/planner`) {
    if (request.method() === "PUT") snapshot = { ...snapshot, ...request.postDataJSON(), version: snapshot.version + 1, savedAt: new Date().toISOString() };
    return route.fulfill({ json: snapshot });
  }
  if (path === `/api/trips/${planId}`) return route.fulfill({ json: trip });
  if (path === "/api/trips") return route.fulfill({ json: { content: [trip], totalElements: 1 } });
  if (path === "/api/users/me") return route.fulfill({ json: { id: "22222222-2222-4222-8222-222222222222", displayName: "Test traveller", email: "traveller@example.invalid", locale: "en", countryCode: "TH", roles: ["USER"] } });
  if (path === "/api/users/me/vehicles" || path === "/api/users/me/places") return route.fulfill({ json: [] });
  if (path === "/api/routes/directions") {
    const body = request.postDataJSON();
    requests.push(body);
    const segments = body.groups.flatMap((group) => group.points.slice(1).map((to, index) => {
      const from = group.points[index];
      const mode = to.arrivalMode ?? "drive";
      const transit = ["transit", "rail", "bus"].includes(mode);
      const rail = mode === "rail" || to.railOnly;
      const fallback = (transit && rail && railMissing) || (mode === "bike" && cyclingMissing);
      const steps = !transit || fallback ? [] : rail ? railRoute.steps : [railRoute.steps[0], { ...railRoute.steps[1], departureStop: origin.name, arrivalStop: destination.name, line: { name: "Bus 15", shortName: "15", color: "#30867D", vehicleType: "BUS" } }];
      return { ...railRoute, id: `${group.blockId}:${from.id}:${to.id}`, blockId: group.blockId,
        fromItemId: from.id, toItemId: to.id, fromName: from.name, toName: to.name, travelMode: mode,
        status: fallback ? "fallback" : "routed", durationSeconds: fallback ? null : mode === "walk" ? 2400 : mode === "bike" ? 1080 : mode === "drive" ? 1200 : 900,
        fallbackReason: fallback ? "No rail route was found" : null,
        steps,
        journeys: body.includeTransitAlternatives && transit && !fallback ? rail ? scheduledJourneys : [{ ...scheduledJourneys[0], steps }] : [],
      };
    }));
    return route.fulfill({ json: { segments } });
  }
  if (path === "/api/geo/places/search") return route.fulfill({ json: { items: [{ provider: "GOOGLE", providerPlaceId: "siam", name: "Siam", address: "Pathum Wan, Bangkok, Thailand", location: { lat: 13.745, lng: 100.534, address: "Bangkok" }, primaryType: "subway_station", openingHours: {} }] } });
  if (path.startsWith("/api/geo/places/")) return route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: "test-station", name: "Station", location: { lat: 13.745, lng: 100.534 }, openingHours: {} } });
  if (path.startsWith("/api/users/") || path.startsWith("/api/trips")) return route.fulfill({ status: 401, json: { message: "Authentication required" } });
  if (path.startsWith("/api/shared-plans")) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
  return route.fulfill({ json: { items: [], content: [], totalElements: 0 } });
});

const draft = async () => snapshot;
async function waitForDraft(check) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check(await draft())) return;
    await page.waitForTimeout(100);
  }
  assert.fail("Expected planner draft was not persisted");
}

try {
  console.log("Opening authenticated planner fixture");
  await page.goto(`${base}/planner/${planId}?destinationName=Bangkok&from=2026-10-13&to=2026-10-13&lat=13.75&lng=100.53`, { waitUntil: "domcontentloaded", timeout: 120000 });
  const trigger = page.getByRole("button", { name: /Travel mode:.*Show routes/ }).first();
  const disclosure = page.getByRole("region", { name: `Routes from ${origin.name} to ${destination.name}`, exact: true });
  await trigger.waitFor({ timeout: 90000 });
  console.log("Planner ready");
  assert.equal(requests.some((request) => request.groups[0]?.points[1]?.arrivalMode === "bike"), false, "Alternative routes fetched before opening options");
  assert.equal(await page.getByText("Travel options", { exact: true }).count(), 0);
  assert.equal(await page.getByText("Travel this leg by", { exact: true }).count(), 0);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await disclosure.getByRole("button", { name: /^Train, \d+ routes?$/ }).waitFor();
  await disclosure.getByRole("combobox", { name: "Sort routes" }).waitFor();
  await disclosure.getByRole("button", { name: "Use this route", exact: true }).waitFor();
  await disclosure.locator('[data-slot="accordion-item"]').first().waitFor();
  assert.equal(await disclosure.locator('[data-slot="accordion-item"]').count(), 3);
  console.log("Rail alternatives ready");
  await disclosure.screenshot({ path: `${output}/journey-dark.png`, timeout: 10000 });
  // Fastest sorts the merged bus/train set. Identify the BTS journey by its lines, not its former row position.
  const primary = disclosure.locator('[data-slot="accordion-item"]').filter({ has: page.locator('[data-slot="accordion-trigger"]', { hasText: "BTS Sukhumvit Line" }) });
  await primary.locator('[data-slot="accordion-trigger"]').click();
  await disclosure.getByRole("list", { name: "Journey directions" }).waitFor();
  assert.ok(await disclosure.getByText("BTS Sukhumvit Line", { exact: true }).count() > 0);
  assert.ok(await disclosure.getByText("BTS Silom Line", { exact: true }).count() > 0);
  await disclosure.getByText("Walk to Victory Monument Station", { exact: true }).waitFor();
  assert.equal(await disclosure.locator('[data-slot="accordion-item"]').count(), 3);
  const alternate = disclosure.locator('[data-slot="accordion-item"]').filter({ has: page.locator('[data-slot="accordion-trigger"]', { hasText: "MRT Blue Line" }) });
  await alternate.getByRole("radio").check();
  await disclosure.getByRole("button", { name: /Transit.*25 min/ }).waitFor();
  await alternate.locator('[data-slot="accordion-trigger"]').click();
  await alternate.getByText("Walk to Alternative station", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Board at Alternative station", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Board at Victory Monument", exact: true }).count(), 0);
  await disclosure.getByRole("button", { name: "Use this route", exact: true }).click();
  await waitForDraft(value => value.blocks[0].items[1].arrivalRouteKey?.includes("MRT Blue Line"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await trigger.click();
  await alternate.getByRole("radio").waitFor();
  assert.equal(await alternate.getByRole("radio").isChecked(), true);
  await primary.locator('[data-slot="accordion-trigger"]').click();
  assert.equal(await disclosure.getByLabel("Transit departure time", { exact: true }).count(), 0);
  assert.ok(requests.some(request => request.groups[0]?.points[1]?.arrivalMode === "rail"));
  assert.ok(requests.some(request => request.groups[0]?.points[1]?.arrivalMode === "bus"));
  assert.ok(requests.every(request => !request.departureTime));
  await disclosure.screenshot({ path: `${output}/journey-details.png` });

  console.log("Testing rail/bus mode switching");
  await disclosure.getByRole("button", { name: /^All, 3 routes$/ }).click();
  await disclosure.getByText("Bus 15", { exact: true }).first().waitFor();
  assert.equal(await disclosure.locator('[data-slot="accordion-item"]').count(), 3);
  await disclosure.getByRole("button", { name: /^Bus, 1 route$/ }).click();
  assert.equal(await disclosure.locator('[data-slot="accordion-item"]').count(), 1);
  await disclosure.getByRole("button", { name: "Use this route", exact: true }).click();
  await waitForDraft((value) => value.blocks[0].items[1].arrivalMode === "bus");
  await disclosure.getByRole("button", { name: /Bike.*18 min/ }).click();
  assert.equal(await page.getByRole("button", { name: /^Board at / }).count(), 0);
  const maps = new URL(await disclosure.getByRole("link", { name: /Google Maps/ }).getAttribute("href"));
  assert.equal(maps.searchParams.get("travelmode"), "bicycling");
  await disclosure.getByRole("button", { name: "Use bike", exact: true }).click();
  await waitForDraft((value) => value.blocks[0].items[1].arrivalMode === "bike");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Travel mode: Bike/ }).waitFor({ timeout: 30000 });
  await trigger.click();
  await disclosure.getByRole("button", { name: /Transit.*20 min/ }).click();
  await disclosure.getByRole("button", { name: /^Train, \d+ routes?$/ }).click();
  await disclosure.getByRole("button", { name: "Use this route", exact: true }).click();
  await waitForDraft((value) => value.blocks[0].items[1].arrivalMode === "rail");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Travel mode: MRT & rail/ }).waitFor();
  await trigger.click();
  await disclosure.getByRole("button", { name: "In plan", exact: true }).waitFor();

  console.log("Testing mobile, light theme and station insertion");
  await page.setViewportSize({ width: 390, height: 844 });
  await disclosure.scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, "Mobile viewport overflows");
  const panel = await disclosure.boundingBox();
  assert.ok(panel.width <= 390);
  await disclosure.screenshot({ path: `${output}/journey-mobile.png` });
  await page.evaluate(() => { document.documentElement.classList.remove("dark"); document.documentElement.classList.add("light"); });
  await disclosure.screenshot({ path: `${output}/journey-light.png` });

  await primary.locator('[data-slot="accordion-trigger"]').click();
  await disclosure.getByRole("button", { name: "Add Siam to plan", exact: true }).first().click();
  await page.getByRole("button", { name: /Siam.*Pathum Wan/ }).click();
  await waitForDraft((value) => value.blocks[0].items.length === 3);
  assert.deepEqual((await draft()).blocks[0].items.map((item) => item.name), [origin.name, "Siam", destination.name]);

  // Restore only the intercepted fixture and test the honest fallback UI.
  railMissing = true; cyclingMissing = true;
  snapshot = { ...snapshot, version: snapshot.version + 1, blocks: [journeyDay] };
  await page.evaluate((id) => localStorage.removeItem(`navio:planner-draft:v1:${id}`), planId);
  await page.reload({ waitUntil: "domcontentloaded" });
  const help = page.getByRole("button", { name: "Why is this connection a straight line?", exact: true }).first();
  await help.waitFor();
  await help.focus();
  await page.keyboard.press("Enter");
  await page.getByText("It is not a confirmed route or a path to follow.", { exact: false }).waitFor();
  await page.keyboard.press("Escape");
  await trigger.click();
  await disclosure.getByRole("button", { name: /Bike.*Unverified/ }).click();
  assert.equal(await disclosure.getByRole("button", { name: "Use bike", exact: true }).count(), 0);
  await disclosure.getByRole("button", { name: /Transit.*20 min/ }).click();
  await disclosure.getByText("Bus 15", { exact: true }).first().waitFor();
  await disclosure.screenshot({ path: `${output}/journey-fallback.png` });
  assert.ok(writes.every((path) => path === `/api/trips/${planId}/planner`));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: "passed", screenshots: output, checks: ["single icon control", "on-demand alternatives", "shadcn journey accordion", "named walking connections", "alternative selection updates map markers", "no departure controls", "rail/bus save/reload", "specific journey selection save/reload", "all transit merges alternatives", "BTS transfer steps", "bus selection", "bike save/reload", "mobile/light/dark", "station insertion", "keyboard help", "fallback cannot be applied"] }));
} catch (error) {
  console.error(JSON.stringify({ errors, failure: String(error) }));
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true, timeout: 10000 }).catch(() => {});
  throw error;
} finally { await browser.close(); }
