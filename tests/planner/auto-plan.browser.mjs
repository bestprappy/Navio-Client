// Isolated browser account: every planner/account/place API is intercepted; no backend writes.
// A zig-zag Tokyo day is auto planned, applied, undone and reapplied, then checked against Calculate times.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
const output = process.env.NAVIO_TEST_OUTPUT ?? "tests/planner/.output/auto-plan";
const planId = "a1000000-0000-4000-8000-000000000081";
const theme = process.env.NAVIO_TEST_THEME ?? "light";
const width = Number(process.env.NAVIO_TEST_WIDTH ?? 1440);
await mkdir(output, { recursive: true });

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const week = (value, overrides = {}) => WEEK.map((day) => `${day}: ${overrides[day] ?? value}`);
const places = {
  sensoji: { name: "Senso-ji", lat: 35.7148, lng: 139.7967, type: "buddhist_temple", hours: week("6:00 AM – 5:00 PM") },
  tower: { name: "Tokyo Tower", lat: 35.6586, lng: 139.7454, type: "tourist_attraction", hours: week("9:00 AM – 11:00 PM") },
  ichiran: { name: "Ichiran Shibuya", lat: 35.6614, lng: 139.7006, type: "ramen_restaurant", hours: week("10:00 AM – 10:00 PM") },
  skytree: { name: "Tokyo Skytree", lat: 35.7101, lng: 139.8107, type: "tourist_attraction", hours: week("10:00 AM – 9:00 PM") },
  meiji: { name: "Meiji Jingu", lat: 35.6764, lng: 139.6993, type: "shinto_shrine", hours: week("5:00 AM – 6:00 PM") },
  museum: { name: "Tokyo National Museum", lat: 35.7188, lng: 139.7765, type: "museum", hours: week("9:30 AM – 5:00 PM", { Wednesday: "Closed" }) },
  sushi: { name: "Sushi Dai", lat: 35.6655, lng: 139.7707, type: "sushi_restaurant", hours: week("5:00 PM – 10:00 PM") },
};
const item = (id) => ({ id, type: "place", placeId: `GOOGLE:${id}`, name: places[id].name, address: "Tokyo, Japan", lat: places[id].lat, lng: places[id].lng });
const note = { id: "tower-note", type: "note", content: "Buy the top deck ticket online" };
const day = { id: "tokyo-day", kind: "itinerary", title: "Tokyo", date: "2026-10-14", colorId: "indigo", items: [
  item("sensoji"), item("tower"), note, item("ichiran"), item("skytree"), item("meiji"), item("museum"), item("sushi"),
] };
const nextDay = { id: "tokyo-day-2", kind: "itinerary", title: "Tokyo", date: "2026-10-15", colorId: "rose", items: [] };
const stamp = new Date().toISOString();
let snapshot = { version: 1, savedAt: stamp, blocks: [day, nextDay], budget: { currency: "JPY", amount: 0, expenses: [] }, capabilities: ["leg-travel-mode-v1", "transit-route-choice-v1", "trip-energy-v1", "trip-garage-v1", "observed-soc-v1", "day-destinations", "day-anchors", "charge-targets", "precise-charging-v1", "time-source-v1"] };
const trip = { id: planId, displayName: "Tokyo auto plan test", title: "Tokyo auto plan test", destinationId: "tokyo", destinationName: "Tokyo", destinationCountry: "Japan", destinationLat: 35.68, destinationLng: 139.76, startDate: "2026-10-14", endDate: "2026-10-15", visibility: "PRIVATE", createdAt: stamp, updatedAt: stamp };

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
page.on("console", (message) => { if (message.type() === "error") console.log("console error:", message.text().slice(0, 300)); });
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
  if (path === "/api/users/me") return route.fulfill({ json: { id: "22222222-2222-4222-8222-222222222222", displayName: "Test traveller", email: "traveller@example.invalid", locale: "en", countryCode: "JP", roles: ["USER"] } });
  if (path === "/api/users/me/vehicles" || path === "/api/users/me/places") return route.fulfill({ json: [] });
  if (path === "/api/routes/directions") {
    const body = request.postDataJSON();
    // Every leg is a routed 20-minute ride.
    const segments = body.groups.flatMap((group) => group.points.slice(1).map((to, index) => {
      const from = group.points[index];
      return { id: `${group.blockId}:${from.id}:${to.id}`, blockId: group.blockId, fromItemId: from.id, toItemId: to.id, fromName: from.name, toName: to.name,
        status: "routed", travelMode: "drive", distanceMeters: 5000, durationSeconds: 1200, fallbackReason: null,
        geometry: { type: "LineString", coordinates: [[from.lng, from.lat], [to.lng, to.lat]] }, steps: [], journeys: [] };
    }));
    return route.fulfill({ json: { segments } });
  }
  const detail = /^\/api\/geo\/places\/([^/]+)$/.exec(path);
  if (detail && places[detail[1]]) {
    const value = places[detail[1]];
    return route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: detail[1], name: value.name, address: "Tokyo, Japan", location: { lat: value.lat, lng: value.lng, address: null, placeId: null }, phone: null, website: null, photoUrl: null, primaryType: value.type, openingHours: { weekdayDescriptions: value.hours } } });
  }
  if (path.startsWith("/api/users/") || path.startsWith("/api/trips")) return route.fulfill({ status: 401, json: { message: "Authentication required" } });
  if (path.startsWith("/api/shared-plans")) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
  return route.fulfill({ json: { items: [], content: [], totalElements: 0 } });
});

async function waitFor(check, message) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) return;
    await page.waitForTimeout(100);
  }
  assert.fail(message);
}
const savedIds = (index = 0) => snapshot.blocks[index].items.map((value) => value.id);
const dialog = () => page.getByRole("dialog", { name: /Auto plan day 1/ });
// Auto plan lives in the day's options menu; the menu trigger gets focus back when the dialog closes.
const menuTrigger = () => page.locator("#trip-block-tokyo-day").getByRole("button", { name: /^Open options for Tokyo/ });
const autoPlan = () => page.getByRole("button", { name: "Auto plan", exact: true });
async function openAutoPlan() {
  await menuTrigger().click();
  await autoPlan().click();
}

try {
  await page.goto(`${base}/planner/${planId}?destinationName=Tokyo&from=2026-10-14&to=2026-10-15&lat=35.68&lng=139.76`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("heading", { name: "Tokyo Skytree" }).first().waitFor({ timeout: 90000 });
  await menuTrigger().waitFor();
  await menuTrigger().scrollIntoViewIfNeeded();
  assert.equal(await page.locator("#trip-block-tokyo-day").getByRole("button", { name: "Auto plan", exact: true }).count(), 0, "Auto plan is not in the day header");
  await page.screenshot({ path: `${output}/day-header-${theme}-${width}.png` });

  // Keyboard opens the menu, then the dialog; the plan appears once opening hours are checked.
  await menuTrigger().focus();
  await page.keyboard.press("Enter");
  await autoPlan().waitFor();
  await page.screenshot({ path: `${output}/menu-${theme}-${width}.png` });
  await autoPlan().focus();
  await page.keyboard.press("Enter");
  await dialog().getByRole("list", { name: "Planned order for day 1" }).waitFor();
  await dialog().getByText("1 place doesn't fit").waitFor();
  await dialog().getByText("Closed on Wednesday").waitFor();
  await dialog().getByText("Lunch", { exact: true }).waitFor();
  await dialog().getByText("Dinner", { exact: true }).waitFor();
  await dialog().getByText(/less than your current order/).waitFor();
  await dialog().screenshot({ path: `${output}/dialog-${theme}-${width}.png` });

  // Escape closes without changing anything and returns focus to the menu trigger.
  await page.keyboard.press("Escape");
  await dialog().waitFor({ state: "hidden" });
  await page.waitForTimeout(300);
  const focused = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 200));
  assert.equal(await menuTrigger().evaluate((element) => element === document.activeElement), true, `Focus is on ${focused}`);
  assert.deepEqual(savedIds(), day.items.map((value) => value.id));

  // Apply, moving the closed museum to day 2.
  await openAutoPlan();
  await dialog().getByRole("list", { name: "Planned order for day 1" }).waitFor();
  await dialog().getByLabel("Put it").click();
  await page.getByRole("option", { name: /^Day 2/ }).click();
  await dialog().getByRole("button", { name: "Apply plan" }).click();
  await dialog().waitFor({ state: "hidden" });
  await page.getByText("Day planned with 6 stops. 1 place moved to day 2.").waitFor();
  await waitFor(() => savedIds(1).includes("museum"), "The museum was not saved on day 2.");
  const planned = savedIds();
  assert.notDeepEqual(planned, day.items.map((value) => value.id).filter((id) => id !== "museum"));
  assert.equal(planned[planned.indexOf("tower") + 1], "tower-note", "The note no longer follows Tokyo Tower.");
  const ichiran = snapshot.blocks[0].items.find((value) => value.id === "ichiran");
  const sushi = snapshot.blocks[0].items.find((value) => value.id === "sushi");
  assert.ok(ichiran.time >= "11:30" && ichiran.time <= "14:00" && ichiran.timeSource === "fixed", `Lunch at ${ichiran.time}`);
  assert.ok(sushi.time >= "17:30" && sushi.timeSource === "fixed", `Dinner at ${sushi.time}`);

  // Calculate times agrees with the plan: nothing needs updating once routes load.
  await page.getByRole("button", { name: /^Open options for Tokyo/ }).first().click();
  const times = page.getByRole("region", { name: "Times" });
  await times.getByRole("button", { name: "Calculate times" }).and(page.locator(":enabled")).waitFor();
  await page.waitForTimeout(500);
  assert.equal(await times.getByText("Needs updating").count(), 0, "Times need updating right after Auto plan.");
  await page.screenshot({ path: `${output}/applied-${theme}-${width}.png` });
  await page.keyboard.press("Escape");

  // Undo restores both days exactly.
  await page.getByRole("button", { name: "Undo" }).first().click();
  await waitFor(() => JSON.stringify(savedIds()) === JSON.stringify(day.items.map((value) => value.id)) && savedIds(1).length === 0, "Undo did not restore both days.");
  await page.getByText(/Day planned with/).waitFor({ state: "hidden" });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(overflow, false, "The page scrolls horizontally.");
  assert.deepEqual(errors, []);
  console.log(`Auto plan browser check passed (${theme}, ${width}px)`);
} finally {
  await browser.close();
}
