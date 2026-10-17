// Isolated browser account: every planner/account/place API is intercepted; no backend writes.
// A zig-zag Tokyo day is auto planned, applied, undone and reapplied, then checked against Calculate times.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
const output = process.env.NAVIO_TEST_OUTPUT ?? "tests/planner/.output/sharing";
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
const trip = { id: planId, displayName: "Tokyo auto plan test", title: "Tokyo auto plan test", destinationCity: "Tokyo", destinationRegion: null, destinationCountryCode: "JP", destinationId: "tokyo", destinationName: "Tokyo", destinationCountry: "Japan", destinationLat: 35.68, destinationLng: 139.76, startDate: "2026-10-14", endDate: "2026-10-15", visibility: "PRIVATE", createdAt: stamp, updatedAt: stamp };

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
let published = { published: false };
await context.route(`${base}/api/**`, async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (path === `/api/trips/${planId}/publication/preview`) {
    return route.fulfill({ json: { sanitizerVersion: 1, title: trip.title, destinationCity: "Tokyo", dayCount: 1, days: [{ label: "Day 1", items: [{ type: "place", placeId: "GOOGLE:sensoji", name: "Senso-ji", lat: 35.7148, lng: 139.7967 }] }] } });
  }
  if (path === `/api/trips/${planId}/publication`) {
    if (["POST", "PUT"].includes(request.method())) {
      const body = request.postDataJSON();
      assert.equal(body.authorDisplayName, null);
      assert.equal(body.title, "Tokyo with friends");
      published = { published: true, token: "test-shared", revision: 1, options: body.options, title: body.title, authorDisplayName: null, listedInExplore: body.listInExplore, publishedAt: stamp };
    }
    return route.fulfill({ json: published });
  }
  if (path === "/api/guides" || path === "/api/traveler-guides") return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0 } });
  if (path === "/api/auth/session") return route.fulfill({ json: { user: { id: "22222222-2222-4222-8222-222222222222", name: "Test traveller" }, expires: "2099-01-01T00:00:00Z" } });
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


try {
  await page.goto(`${base}/planner/${planId}?destinationName=Tokyo&from=2026-10-14&to=2026-10-15&lat=35.68&lng=139.76`, { waitUntil: "domcontentloaded", timeout: 120000 });
  console.log("planner loaded", await page.title());
  await page.getByRole("button", { name: /Trip options for/ }).click({ timeout: 30000 });
  await page.getByRole("menuitem", { name: "Publish plan as a link" }).click();
  const dialog = page.getByRole("dialog");
  console.log("sharing opened");
  await dialog.getByLabel("Shared plan name").fill("Tokyo with friends");
  await dialog.getByRole("button", { name: "All trip details", exact: true }).click();
  assert.equal(await dialog.getByRole("checkbox", { name: "Include travel dates" }).isChecked(), true);
  await dialog.getByRole("button", { name: "Itinerary only", exact: true }).click();
  assert.equal(await dialog.getByRole("checkbox", { name: "Include travel dates" }).isChecked(), false);
  await dialog.getByRole("checkbox", { name: "Show my name" }).uncheck();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${output}/settings-${theme}-${width}.png` });
  assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
  await dialog.getByRole("button", { name: "Preview shared plan" }).click();
  await dialog.getByRole("heading", { name: "Tokyo with friends", exact: true }).waitFor();
  await dialog.getByRole("heading", { name: "Senso-ji", exact: true }).waitFor();
  assert.equal(await dialog.getByRole("button", { name: /Auto plan|Add place|Publish link|Edit trip/ }).count(), 0);
  assert.equal(await dialog.getByText(/Oct 14/).count(), 0, "Private dates must not enter the preview");
  assert.equal(await dialog.locator("#shared-preview-scroll-panel").count(), 1);
  await page.screenshot({ path: `${output}/preview-${theme}-${width}.png` });
  await dialog.getByRole("button", { name: "Back", exact: true }).click();
  await dialog.getByRole("button", { name: "Publish link", exact: true }).click();
  await dialog.getByRole("link", { name: "Open shared plan" }).waitFor();
  assert.equal(published.published, true);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.deepEqual(errors, []);
  console.log(`PASS sharing ${theme} ${width}`);
} catch (error) { await page.screenshot({ path: `${output}/failure-${theme}-${width}.png` }); throw error; } finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 3000))]); }
