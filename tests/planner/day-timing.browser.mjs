// Isolated browser account: every planner/account API is intercepted; no backend writes.
// Walks the fixed -> calculated -> fixed -> calculated example end to end.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
const output = process.env.NAVIO_TEST_OUTPUT ?? "tests/planner/.output/day-timing";
const planId = "a1000000-0000-4000-8000-000000000071";
const theme = process.env.NAVIO_TEST_THEME ?? "dark";
const width = Number(process.env.NAVIO_TEST_WIDTH ?? 1440);
await mkdir(output, { recursive: true });

const place = (id, name, lat, lng, extra = {}) => ({ id, type: "place", placeId: `GOOGLE:${id}`, name, address: "Bangkok, Thailand", lat, lng, ...extra });
const day = { id: "timing-day", kind: "itinerary", title: "Bangkok", date: "2026-10-14", colorId: "teal", items: [
  place("palace", "Grand Palace", 13.75, 100.491, { time: "09:00", timeEnd: "10:00", timeSource: "fixed" }),
  place("pho", "Wat Pho", 13.746, 100.493),
  place("arun", "Wat Arun", 13.744, 100.488, { time: "11:05", timeEnd: "12:00", timeSource: "fixed" }),
  place("chinatown", "Chinatown", 13.74, 100.51),
] };
const stamp = new Date().toISOString();
let snapshot = { version: 1, savedAt: stamp, blocks: [day], budget: { currency: "THB", amount: 0, expenses: [] }, capabilities: ["leg-travel-mode-v1", "transit-route-choice-v1", "trip-energy-v1", "trip-garage-v1", "observed-soc-v1", "day-destinations", "day-anchors", "charge-targets", "precise-charging-v1", "time-source-v1"] };
const trip = { id: planId, displayName: "Bangkok timing test", title: "Bangkok timing test", destinationId: "bangkok", destinationName: "Bangkok", destinationCountry: "Thailand", destinationLat: 13.75, destinationLng: 100.5, startDate: "2026-10-14", endDate: "2026-10-14", visibility: "PRIVATE", createdAt: stamp, updatedAt: stamp };

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("The local development Auth.js secret is required for this isolated browser test.");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width, height: 1000 } });
context.setDefaultTimeout(20000);
const cookie = await encode({ secret, salt: "authjs.session-token", token: { sub: "22222222-2222-4222-8222-222222222222", name: "Test traveller", accessToken: "synthetic-test-only", accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
await context.addCookies([{ name: "authjs.session-token", value: cookie, url: base, httpOnly: true, sameSite: "Lax" }]);
await context.addInitScript((value) => { localStorage.setItem("theme", value); }, theme);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const consoleErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300)); });
await context.route(`${base}/api/**`, async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
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
    // Every leg is a routed 15-minute drive.
    const segments = body.groups.flatMap((group) => group.points.slice(1).map((to, index) => {
      const from = group.points[index];
      return { id: `${group.blockId}:${from.id}:${to.id}`, blockId: group.blockId, fromItemId: from.id, toItemId: to.id, fromName: from.name, toName: to.name,
        status: "routed", travelMode: "drive", distanceMeters: 4000, durationSeconds: 900, fallbackReason: null,
        geometry: { type: "LineString", coordinates: [[from.lng, from.lat], [to.lng, to.lat]] }, steps: [], journeys: [] };
    }));
    return route.fulfill({ json: { segments } });
  }
  if (path.startsWith("/api/geo/places/")) return route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: "place", name: "Place", location: { lat: 13.75, lng: 100.5 }, openingHours: {} } });
  if (path.startsWith("/api/users/") || path.startsWith("/api/trips")) return route.fulfill({ status: 401, json: { message: "Authentication required" } });
  if (path.startsWith("/api/shared-plans")) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
  return route.fulfill({ json: { items: [], content: [], totalElements: 0 } });
});

const savedItem = (id) => snapshot.blocks[0].items.find((item) => item.id === id);
async function waitForSave(check, message) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) return;
    await page.waitForTimeout(100);
  }
  assert.fail(message);
}

const menuTrigger = () => page.getByRole("button", { name: /^Open options for Bangkok/ });
const times = () => page.getByRole("region", { name: "Times" });
async function openMenu() {
  if (await times().isVisible()) return;
  await menuTrigger().click();
  await times().waitFor();
}
async function closeMenu() {
  if (!(await times().isVisible())) return;
  await page.keyboard.press("Escape");
  await times().waitFor({ state: "hidden" });
}
async function shot(name) {
  await openMenu();
  await page.getByRole("dialog").filter({ has: times() }).screenshot({ path: `${output}/${name}-menu-${theme}-${width}.png`, timeout: 10000 });
  await page.screenshot({ path: `${output}/${name}-${theme}-${width}.png` });
}

async function open() {
  await page.goto(`${base}/planner/${planId}?destinationName=Bangkok&from=2026-10-14&to=2026-10-14&lat=13.75&lng=100.5`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("heading", { name: "Wat Pho" }).waitFor({ timeout: 90000 });
  await menuTrigger().waitFor();
}

try {
  await open();
  console.log("Planner ready");
  await openMenu();
  await times().getByRole("button", { name: "Calculate times" }).and(page.locator(":enabled")).waitFor();
  await shot("initial");

  // Calculate times keeps A and C and fills B and D; the menu stays open to offer Undo.
  await times().getByRole("button", { name: "Calculate times" }).focus();
  await page.keyboard.press("Enter");
  await times().getByRole("status").getByText("2 stop times updated.").waitFor();
  await times().getByRole("button", { name: "Undo" }).waitFor();
  await shot("calculated");
  await closeMenu();
  await page.getByText("10:15 AM – 11:15 AM").waitFor();
  await page.getByText("12:15 PM – 1:15 PM").waitFor();
  const warning = page.getByText("You need 25 more minutes to reach Wat Arun on time.");
  await warning.waitFor();
  assert.ok(await page.getByText("11:05 AM – 12:00 PM").count() > 0, "Wat Arun's fixed time moved");
  await warning.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/late-${theme}-${width}.png` });

  // The time popover says where a time comes from and can hand a fixed time back.
  await page.getByRole("heading", { name: "Wat Pho" }).click();
  await page.getByRole("button", { name: /calculated time\. Edit time/ }).click();
  await page.getByText("Calculated from visit and travel times. Saving a time here fixes it.").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Wat Arun" }).click();
  await page.getByRole("button", { name: /fixed time\. Edit time/ }).click();
  await page.getByRole("button", { name: "Let Calculate times set this time" }).waitFor();
  await page.screenshot({ path: `${output}/popover-fixed-${theme}-${width}.png` });
  await page.keyboard.press("Escape");
  await waitForSave(() => savedItem("pho")?.timeSource === "calculated" && savedItem("arun")?.timeSource === "fixed", "Calculated times were not saved");
  console.log("Calculated and saved");

  // Undo restores, then calculate again for the reload check.
  await openMenu();
  await times().getByRole("button", { name: "Undo" }).click();
  await times().getByText("Times restored.").waitFor();
  assert.equal(await page.getByText("10:15 AM – 11:15 AM").count(), 0);
  await times().getByRole("button", { name: "Calculate times" }).click();
  await page.getByText("10:15 AM – 11:15 AM").waitFor();
  await closeMenu();
  await waitForSave(() => savedItem("pho")?.time === "10:15", "Recalculated times were not saved");

  // Fixed/calculated survive a reload.
  await open();
  await page.getByText("You need 25 more minutes to reach Wat Arun on time.").waitFor();
  assert.ok(await page.getByText("Calculated time:", { exact: false }).count() >= 2, "Calculated chips were lost on reload");
  console.log("Reload kept fixed and calculated times");

  // Recalculate all times reviews the replaced fixed time; Cancel changes nothing.
  await openMenu();
  await times().getByRole("button", { name: /Recalculate all times/ }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Replace 1 edited time?" });
  await dialog.waitFor();
  await times().waitFor({ state: "hidden" });
  await dialog.getByText("Wat Arun").waitFor();
  await dialog.screenshot({ path: `${output}/replace-dialog-${theme}-${width}.png` });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(savedItem("arun").time, "11:05");

  await openMenu();
  await times().getByRole("button", { name: /Recalculate all times/ }).click();
  await dialog.getByRole("button", { name: "Replace and calculate" }).click();
  await page.getByText("11:30 AM – 12:25 PM").waitFor();
  assert.equal(await page.getByText("You need 25 more minutes to reach Wat Arun on time.").count(), 0);
  await openMenu();
  await times().getByRole("button", { name: "Undo" }).click();
  await closeMenu();
  await page.getByText("11:05 AM – 12:00 PM").waitFor();
  console.log("Replace review, cancel, replace and undo work");

  // Moving a stop makes the calculated times stale, which the menu button shows while closed.
  await page.getByRole("button", { name: "Move item up" }).last().click();
  await page.getByRole("button", { name: /Open options for Bangkok, times need updating/ }).waitFor();
  await page.getByRole("button", { name: /Open options for Bangkok/ }).screenshot({ path: `${output}/stale-trigger-${theme}-${width}.png` });
  await openMenu();
  await times().getByText("Needs updating").waitFor();
  await shot("stale");
  await closeMenu();
  console.log("Stale times flagged");

  // Route lines and export now live in the itinerary options menu.
  await page.getByRole("button", { name: "Itinerary options" }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Itinerary options" }).locator("xpath=..").screenshot({ path: `${output}/itinerary-toolbar-${theme}-${width}.png` });
  await page.getByRole("button", { name: "Itinerary options" }).click();
  const routeLines = page.getByRole("radiogroup", { name: "Route lines on map" });
  await routeLines.waitFor();
  await routeLines.getByRole("radio", { checked: true }).focus();
  await page.keyboard.press("End");
  assert.equal(await routeLines.getByRole("radio", { name: "Place" }).getAttribute("aria-checked"), "true");
  await page.getByText("The leg to the place you scroll to stands out; the rest of its day fades.").waitFor();
  await page.getByRole("dialog").filter({ has: routeLines }).screenshot({ path: `${output}/itinerary-menu-${theme}-${width}.png` });
  await page.getByRole("button", { name: "Export table" }).click();
  const exportDialog = page.getByRole("dialog").filter({ hasText: "Export itinerary as a table" });
  await exportDialog.waitFor();
  await routeLines.waitFor({ state: "hidden" });
  await page.keyboard.press("Escape");
  await exportDialog.waitFor({ state: "hidden" });
  console.log("Itinerary options menu works");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "Page overflows horizontally");
  assert.deepEqual(errors, []);
  if (consoleErrors.length) console.log("Console errors:\n" + [...new Set(consoleErrors)].join("\n"));
  console.log("PASS");
} finally {
  await browser.close();
}