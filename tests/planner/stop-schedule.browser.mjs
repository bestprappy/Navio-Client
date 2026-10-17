// Isolated browser account: every planner/account API is intercepted; no backend writes.
// Plans moments inside a stop, then checks they save, sort, move with the stop and render on the closed card.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
const output = process.env.NAVIO_TEST_OUTPUT ?? "tests/planner/.output/stop-schedule";
const planId = "a1000000-0000-4000-8000-000000000072";
const theme = process.env.NAVIO_TEST_THEME ?? "dark";
const width = Number(process.env.NAVIO_TEST_WIDTH ?? 1440);
await mkdir(output, { recursive: true });

const place = (id, name, lat, lng, extra = {}) => ({ id, type: "place", placeId: `GOOGLE:${id}`, name, address: "Taoyuan City, Taiwan", lat, lng, ...extra });
const day = { id: "schedule-day", kind: "itinerary", title: "Taipei", date: "2026-10-14", colorId: "pink", items: [
  place("hotel", "Hotel Gracery Taipei", 25.044, 121.507, {
    time: "09:00", timeEnd: "10:20", timeSource: "fixed",
    schedule: [
      { id: "m-in", time: "09:00", timeEnd: "09:10", label: "Check out at the front desk" },
      { id: "m-shower", time: "09:30", label: "Shower" },
    ],
    notes: "## Before leaving\n- [ ] Passport and EasyCard\n- [x] Charge power bank\n\nAsk about **luggage storage** until 6 pm.",
  }),
  place("terminal", "Airport Terminal 2", 25.077, 121.232, { time: "11:30", timeEnd: "12:40", timeSource: "fixed", notes: "7:30 AM เอากระเป๋า" }),
] };
const stamp = new Date().toISOString();
let snapshot = { version: 1, savedAt: stamp, blocks: [day], budget: { currency: "TWD", amount: 0, expenses: [] }, capabilities: ["leg-travel-mode-v1", "transit-route-choice-v1", "trip-energy-v1", "trip-garage-v1", "observed-soc-v1", "day-destinations", "day-anchors", "charge-targets", "precise-charging-v1", "time-source-v1", "item-schedule-v1"] };
const trip = { id: planId, displayName: "Taipei schedule test", title: "Taipei schedule test", destinationId: "taipei", destinationName: "Taipei", destinationCountry: "Taiwan", destinationLat: 25.04, destinationLng: 121.5, startDate: "2026-10-14", endDate: "2026-10-14", visibility: "PRIVATE", createdAt: stamp, updatedAt: stamp };

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("The local development Auth.js secret is required for this isolated browser test.");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width, height: 1100 } });
context.setDefaultTimeout(20000);
const cookie = await encode({ secret, salt: "authjs.session-token", token: { sub: "22222222-2222-4222-8222-222222222222", name: "Test traveller", accessToken: "synthetic-test-only", accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
await context.addCookies([{ name: "authjs.session-token", value: cookie, url: base, httpOnly: true, sameSite: "Lax" }]);
await context.addInitScript((value) => { localStorage.setItem("theme", value); }, theme);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const consoleErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200)); });
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
    const segments = body.groups.flatMap((group) => group.points.slice(1).map((to, index) => {
      const from = group.points[index];
      return { id: `${group.blockId}:${from.id}:${to.id}`, blockId: group.blockId, fromItemId: from.id, toItemId: to.id, fromName: from.name, toName: to.name,
        status: "routed", travelMode: "drive", distanceMeters: 40000, durationSeconds: 2400, fallbackReason: null,
        geometry: { type: "LineString", coordinates: [[from.lng, from.lat], [to.lng, to.lat]] }, steps: [], journeys: [] };
    }));
    return route.fulfill({ json: { segments } });
  }
  if (path.startsWith("/api/geo/places/")) return route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: "place", name: "Place", location: { lat: 25.04, lng: 121.5 }, openingHours: {} } });
  if (path.startsWith("/api/users/") || path.startsWith("/api/trips")) return route.fulfill({ status: 401, json: { message: "Authentication required" } });
  if (path.startsWith("/api/shared-plans")) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
  return route.fulfill({ json: { items: [], content: [], totalElements: 0 } });
});

const savedHotel = () => snapshot.blocks[0].items.find((item) => item.id === "hotel");
async function waitForSave(check, message) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) return;
    await page.waitForTimeout(100);
  }
  assert.fail(message);
}
const hotelCard = () => page.locator("article").filter({ has: page.getByRole("heading", { name: "Hotel Gracery Taipei" }) }).first();
const schedule = () => page.getByRole("region", { name: "Schedule at Hotel Gracery Taipei" });

try {
  await page.goto(`${base}/planner/${planId}?destinationName=Taipei&from=2026-10-14&to=2026-10-14&lat=25.04&lng=121.5`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("heading", { name: "Hotel Gracery Taipei" }).waitFor({ timeout: 120000 });

  // Closed card: the moments and formatted notes, not raw markdown.
  const closedList = page.getByRole("list", { name: "Schedule at Hotel Gracery Taipei" });
  await closedList.waitFor();
  assert.equal(await closedList.getByRole("listitem").count(), 2);
  await page.getByText("Before leaving", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("## Before leaving").count(), 0, "notes render as formatted text");
  await hotelCard().scrollIntoViewIfNeeded();
  await hotelCard().screenshot({ path: `${output}/closed-${theme}-${width}.png` });

  // Open the card and add a moment the way the traveller already writes notes.
  await page.getByRole("heading", { name: "Hotel Gracery Taipei" }).click();
  await schedule().waitFor();
  await schedule().getByRole("button", { name: "Add a time" }).click();
  const newLabel = schedule().getByRole("textbox", { name: "What happens at 9:40 AM" });
  await newLabel.waitFor();
  assert.equal(await newLabel.evaluate((node) => node === document.activeElement), true, "the new moment's label has focus");
  await newLabel.fill("10:10-10:20 Prepare to leave");
  await page.keyboard.press("Enter");
  await waitForSave(() => savedHotel().schedule?.length === 4, "Enter saved the moment and started the next one");
  const third = savedHotel().schedule[2];
  assert.deepEqual([third.time, third.timeEnd, third.label], ["10:10", "10:20", "Prepare to leave"]);
  assert.equal(savedHotel().schedule[3].time, "10:20", "the next moment starts when the last one ends");

  // Backspace on the empty new moment removes it and returns to the previous one.
  await page.keyboard.press("Backspace");
  await waitForSave(() => savedHotel().schedule.length === 3, "Backspace removed the empty moment");
  await page.getByText("40 min free").waitFor();

  // A typed start time sorts the moment into place; a time outside the stop is flagged.
  const shower = schedule().getByRole("textbox", { name: "Start time for Shower" });
  await shower.fill("8:40");
  await shower.press("Enter");
  await waitForSave(() => savedHotel().schedule[0].label === "Shower", "the moment moved to the top");
  await schedule().getByText("Outside this stop's time, 9:00 AM – 10:20 AM").waitFor();
  await shower.fill("soon");
  await shower.press("Enter");
  await schedule().getByRole("alert").filter({ hasText: "Use a time like" }).waitFor();
  assert.equal(await shower.getAttribute("aria-invalid"), "true");
  await shower.fill("9:30");
  await shower.press("Enter");
  await waitForSave(() => savedHotel().schedule[1].label === "Shower" && savedHotel().schedule[1].time === "09:30", "a valid time clears the error");
  await hotelCard().screenshot({ path: `${output}/editing-${theme}-${width}.png` });

  // Moving the stop moves its moments with it.
  await hotelCard().getByRole("button", { name: /Edit time/ }).click();
  await page.getByRole("textbox", { name: "Start time", exact: true }).fill("10:00 AM");
  await page.getByRole("textbox", { name: "End time", exact: true }).fill("11:20 AM");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await waitForSave(() => savedHotel().time === "10:00" && savedHotel().schedule[0].time === "10:00", "the schedule moved with the stop");
  assert.deepEqual(savedHotel().schedule.map((entry) => entry.time), ["10:00", "10:30", "11:10"]);

  // Notes use the block editor: a slash command makes a to-do.
  // The press only swaps the static notes for the lazily loaded editor; keys typed before it mounts are lost.
  const notes = hotelCard().getByRole("textbox", { name: "Notes for Hotel Gracery Taipei" });
  await notes.click();
  await hotelCard().locator('[contenteditable="true"][aria-label="Notes for Hotel Gracery Taipei"]').waitFor();
  await page.waitForFunction(() => document.activeElement?.isContentEditable === true);
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/todo");
  await page.getByRole("listbox", { name: "Blocks" }).getByRole("option", { selected: true }).waitFor();
  await page.keyboard.press("Enter");
  await page.keyboard.type("Return the room key");
  await waitForSave(() => /- \[ \] Return the room key/.test(savedHotel().notes ?? ""), "the notes saved a to-do as markdown");

  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "no horizontal overflow");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, theme, width, consoleErrors, schedule: savedHotel().schedule, notes: savedHotel().notes }));
} catch (error) {
  await page.screenshot({ path: `${output}/failure-${theme}-${width}.png`, fullPage: false }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
