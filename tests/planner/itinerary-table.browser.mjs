// Isolated browser account: every planner/account API is intercepted; no backend writes.
// Opens the itinerary table, searches and filters it, prints the PDF handout and returns to the plan.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
const output = process.env.NAVIO_TEST_OUTPUT ?? "tests/planner/.output/itinerary-table";
const planId = "a1000000-0000-4000-8000-000000000081";
const theme = process.env.NAVIO_TEST_THEME ?? "light";
const width = Number(process.env.NAVIO_TEST_WIDTH ?? 1440);
const tag = `${theme}-${width}`;
await mkdir(output, { recursive: true });

const photo = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect width="120" height="90" fill="hsl(${hue} 45% 55%)"/><circle cx="90" cy="25" r="12" fill="hsl(${hue} 60% 85%)"/></svg>`)}`;
const place = (id, name, lat, lng, extra = {}) => ({ id, type: "place", placeId: `GOOGLE:${id}`, name, address: `${name} Rd, Bangkok`, lat, lng, ...extra });
const days = [
  { id: "day-1", kind: "itinerary", title: "Old town and the river", date: "2026-12-22", colorId: "teal",
    startAnchor: { id: "anchor-hotel", kind: "PLACE", name: "Riva Surya Hotel", address: "23 Phra Athit Rd", lat: 13.762, lng: 100.494 },
    endAnchor: { id: "anchor-hotel-end", kind: "PLACE", name: "Riva Surya Hotel", address: "23 Phra Athit Rd", lat: 13.762, lng: 100.494 },
    items: [
      place("wat-pho", "Wat Pho", 13.746, 100.493, { description: "Buddhist temple", placeType: "buddhist_temple", time: "09:00", timeEnd: "10:30", timeSource: "fixed", imageUrl: photo(30),
        notes: "## Dress code\n- Cover **shoulders** and knees\n- [ ] Bring small change for donations",
        schedule: [{ id: "m1", time: "09:00", timeEnd: "09:15", label: "Meet the group at the north gate" }, { id: "m2", time: "10:00", label: "Thai massage school visit" }] }),
      place("wat-arun", "Wat Arun", 13.743, 100.488, { time: "11:00", timeEnd: "12:00", timeSource: "calculated", arrivalMode: "transit", imageUrl: photo(200), notes: "Take the cross-river ferry from Tha Tien pier." }),
      place("jay-fai", "Jay Fai", 13.752, 100.504, { description: "Thai restaurant", placeType: "thai_restaurant", time: "12:30", timeEnd: "13:30", timeSource: "fixed", cost: 1200, notes: "Queue opens at noon." }),
    ] },
  { id: "day-2", kind: "itinerary", title: "2026-12-23", date: "2026-12-23", colorId: "amber",
    items: [
      place("chatuchak", "Chatuchak Weekend Market", 13.799, 100.55, { time: "08:30", timeEnd: "11:30", timeSource: "fixed", cost: 800, imageUrl: photo(45) }),
      { ...place("ev-1", "PTT EV Station Vibhavadi", 13.81, 100.56), placeId: "ev-charger:ptt", evCharger: { connectorTypes: ["CCS2"], maxKw: 120, totalConnectors: 4, availableConnectors: null, priceText: null, openingHoursSummary: null, estimatedChargeMinutes: 35, targetBatteryPct: 80, operatorName: "PTT" } },
      place("ayutthaya", "Ayutthaya Historical Park", 14.356, 100.567, { time: "14:00", timeSource: "calculated" }),
    ] },
  { id: "day-3", kind: "itinerary", title: "2026-12-24", date: "2026-12-24", colorId: "violet", items: [] },
];
const stamp = new Date().toISOString();
const snapshot = { version: 1, savedAt: stamp, blocks: days, budget: { currency: "THB", amount: 20000, expenses: [
  { id: "place-expense-wat-pho/entry", amount: 300, label: "Entry ticket", categoryId: "activities" },
  { id: "place-expense-wat-pho/guide", amount: 500, label: "Temple guide", categoryId: "activities" },
] }, capabilities: ["leg-travel-mode-v1", "transit-route-choice-v1", "trip-energy-v1", "trip-garage-v1", "observed-soc-v1", "day-destinations", "day-anchors", "charge-targets", "precise-charging-v1", "time-source-v1", "item-schedule-v1"] };
const trip = { id: planId, displayName: "Bangkok with the family", title: "Bangkok with the family", destinationCity: "Bangkok", destinationRegion: null, destinationCountryCode: "TH", destinationId: "bangkok", destinationName: "Bangkok", destinationCountry: "Thailand", destinationLat: 13.75, destinationLng: 100.5, startDate: "2026-12-22", endDate: "2026-12-24", visibility: "PRIVATE", createdAt: stamp, updatedAt: stamp };

const legFor = (toId) => ({
  "wat-pho": { travelMode: "drive", durationSeconds: 900, distanceMeters: 3200 },
  "wat-arun": { travelMode: "transit", durationSeconds: 1500, distanceMeters: 4200, steps: [
    { travelMode: "walk", durationSeconds: 300, geometry: { type: "LineString", coordinates: [] } },
    { travelMode: "transit", durationSeconds: 600, geometry: { type: "LineString", coordinates: [] }, line: { name: "23E REG (3–4E) : สำโรง - เทเวศร์ (ทางด่วน)", shortName: "23E REG (3–4E)", color: "#0A9F3B", vehicleType: "BUS" }, departureStop: "Tha Tien", arrivalStop: "Sanam Chai", stopCount: 4, headsign: "Thewet" },
    { travelMode: "transit", durationSeconds: 300, geometry: { type: "LineString", coordinates: [] }, line: { name: "สายสุขุมวิท", color: "#7CB342", vehicleType: "SUBWAY" }, departureStop: "Sanam Chai", arrivalStop: "Sukhumvit", stopCount: 3 },
    { travelMode: "transit", durationSeconds: 300, geometry: { type: "LineString", coordinates: [] }, line: { name: "Blue Line", color: "#1E4FD8", vehicleType: "SUBWAY" }, departureStop: "Sanam Chai", arrivalStop: "Itsaraphap", stopCount: 1 },
    { travelMode: "walk", durationSeconds: 300, geometry: { type: "LineString", coordinates: [] } },
  ] },
  "jay-fai": { travelMode: "walk", durationSeconds: 2400, distanceMeters: 1900 },
  "day-1:end": { travelMode: "drive", durationSeconds: 600, distanceMeters: 2500 },
  "ev-1": { travelMode: "drive", durationSeconds: 1300, distanceMeters: 9000 },
  ayutthaya: { status: "fallback", travelMode: "drive", durationSeconds: null, distanceMeters: 61000, fallbackReason: "No route" },
}[toId] ?? { travelMode: "drive", durationSeconds: 600, distanceMeters: 1000 });

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("The local development Auth.js secret is required for this isolated browser test.");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width, height: 1000 }, acceptDownloads: true });
context.setDefaultTimeout(20000);
const cookie = await encode({ secret, salt: "authjs.session-token", token: { sub: "22222222-2222-4222-8222-222222222222", name: "Test traveller", accessToken: "synthetic-test-only", accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
await context.addCookies([{ name: "authjs.session-token", value: cookie, url: base, httpOnly: true, sameSite: "Lax" }]);
await context.addInitScript((value) => {
  localStorage.setItem("theme", value);
  localStorage.removeItem("navio:itinerary-handout-options");
}, theme);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const consoleErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300)); });
const writes = [];
await context.route(`${base}/api/**`, async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (path.startsWith("/api/auth/")) return route.continue();
  if (path === `/api/trips/${planId}/planner`) {
    if (request.method() === "PUT") writes.push(path);
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
      const leg = legFor(to.id);
      const steps = (leg.steps ?? []).map((step) => ({ ...step, geometry: { type: "LineString", coordinates: [[from.lng, from.lat], [to.lng, to.lat]] } }));
      return { id: `${group.blockId}:${from.id}:${to.id}`, blockId: group.blockId, fromItemId: from.id, toItemId: to.id, fromName: from.name, toName: to.name,
        status: "routed", fallbackReason: null, geometry: { type: "LineString", coordinates: [[from.lng, from.lat], [to.lng, to.lat]] }, journeys: [], ...leg, steps };
    }));
    return route.fulfill({ json: { segments } });
  }
  if (path.startsWith("/api/geo/places/")) return route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: "place", name: "Place", location: { lat: 13.75, lng: 100.5 }, openingHours: {} } });
  if (path.startsWith("/api/users/") || path.startsWith("/api/trips")) return route.fulfill({ status: 401, json: { message: "Authentication required" } });
  if (path.startsWith("/api/shared-plans")) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
  return route.fulfill({ json: { items: [], content: [], totalElements: 0 } });
});

const table = () => page.getByRole("region", { name: "Itinerary table" });
const noPageOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

try {
  await page.goto(`${base}/planner/${planId}?destinationName=Bangkok&from=2026-12-22&to=2026-12-24&lat=13.75&lng=100.5`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("group", { name: "Itinerary view" }).waitFor({ timeout: 120000 });

  // Plan -> Table from the itinerary's view switch; the URL records it.
  await page.getByRole("group", { name: "Itinerary view" }).getByRole("button", { name: "Table" }).click();
  await table().waitFor();
  assert.match(page.url(), /[?&]view=table/);
  assert.match(page.url(), /destinationName=Bangkok/, "other query parameters are kept");
  await table().getByRole("heading", { name: "Bangkok with the family" }).waitFor();
  await table().getByRole("heading", { name: "Day 1: Old town and the river" }).waitFor();
  await table().getByText("Public transit").first().waitFor();
  assert.equal(await page.getByRole("separator", { name: "Resize itinerary drawer" }).isVisible(), false, "planner is hidden under the table");

  const dayOne = table().getByRole("table", { name: "Day 1: Old town and the river" });
  assert.equal(await dayOne.locator("tbody tr").count(), 5, "start, three places and end");
  const dayOneText = await dayOne.innerText();
  assert.match(dayOneText, /First stop/);
  assert.match(dayOneText, /9:00 AM – 1:30 PM/, "day summary spans the timed stops");
  assert.match(dayOneText, /Dress code\. Cover shoulders and knees\./, "notes are plain sentences");
  assert.match(dayOneText, /Meet the group at the north gate/);
  assert.match(dayOneText, /Walk/);
  assert.match(dayOneText, /23E REG \(3–4E\)/, "the chosen bus line is listed");
  assert.match(dayOneText, /Blue Line/);
  assert.match(dayOneText, /10 min walk, 2 transfers/);
  assert.match(dayOneText, /Arrives 10 min late/, "a 40 minute walk after a noon finish misses 12:30");
  assert.match(dayOneText, /1 hr 30 min/, "Wat Pho's stay");
  const typeColumn = await dayOne.locator("tbody tr").nth(1).locator("td").nth(2).innerText();
  assert.equal(typeColumn.trim(), "Buddhist temple", "the place type has its own column");
  assert.match(await table().getByRole("table", { name: /^Day 2/ }).innerText(), /EV charging/);
  assert.match(dayOneText, /2 expenses/);
  assert.match(await table().getByRole("table", { name: /^Day 2/ }).innerText(), /Route not confirmed/);
  // Day 3 has no places; it still starts where the day before ended.
  await table().getByRole("heading", { name: "Day 3" }).waitFor();
  assert.ok(await noPageOverflow(), "no horizontal page overflow");
  // Nothing inside a cell may spill past it: text truncates or wraps within its column.
  const spills = await table().evaluate((root) => [...root.querySelectorAll("td *")].flatMap((element) => {
    const cell = element.closest("td").getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return box.width && (box.right > cell.right + 1 || box.left < cell.left - 1) ? [`${element.className || element.tagName}: ${element.textContent.slice(0, 40)}`] : [];
  }));
  assert.deepEqual(spills, [], "content stays inside its cell");
  const rideLines = await table().locator('ol[aria-label="Lines taken"]').evaluateAll((lists) => lists.map((list) => new Set([...list.children].map((child) => Math.round(child.getBoundingClientRect().top))).size));
  assert.ok(rideLines.every((count) => count === 1), "transit lines stay on one line");
  const squeezedIcons = await table().locator("td svg").evaluateAll((icons) => icons.filter((icon) => icon.getBoundingClientRect().width > 0 && icon.getBoundingClientRect().width < 10).length);
  assert.equal(squeezedIcons, 0, "no icon is squeezed by long text");
  await page.screenshot({ path: `${output}/table-${tag}.png` });

  // Search narrows the rows and Escape clears it.
  const search = table().getByRole("searchbox", { name: "Search stops and notes" });
  await search.fill("ferry");
  await table().getByText("1 match").waitFor();
  assert.equal(await table().getByRole("table").count(), 1);
  await search.press("Escape");
  await table().getByRole("table", { name: /^Day 2/ }).waitFor();
  await search.fill("zzz-no-such-stop");
  await table().getByText(/No stops match/).waitFor();
  await table().getByRole("status").getByRole("button", { name: "Clear search" }).click();

  // Day filter and collapse.
  await table().getByRole("button", { name: "Days shown: All days" }).click();
  await page.getByRole("menuitemcheckbox", { name: /Day 2/ }).click();
  await page.keyboard.press("Escape");
  await table().getByRole("button", { name: "Days shown: 2 of 3 days" }).waitFor();
  assert.equal(await table().getByRole("heading", { name: /^Day 2/ }).count(), 0);
  const dayOneToggle = table().getByRole("button", { name: "Day 1: Old town and the river" });
  await dayOneToggle.click();
  assert.equal(await dayOneToggle.getAttribute("aria-expanded"), "false");
  await dayOneToggle.press("Enter");
  assert.equal(await dayOneToggle.getAttribute("aria-expanded"), "true");

  // Spreadsheet export downloads the shown days.
  await table().getByRole("button", { name: "Export" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "Excel workbook" }).click()]);
  assert.match(download.suggestedFilename(), /^bangkok-itinerary\.xlsx$/);

  // PDF handout: options, preview and the printed copy.
  await table().getByRole("button", { name: "Export" }).click();
  await page.getByRole("menuitem", { name: /PDF handout/ }).click();
  const dialog = page.getByRole("dialog", { name: "PDF handout" });
  await dialog.waitFor();
  await dialog.getByLabel("Prepared by").fill("Siam Family Tours");
  await dialog.getByRole("checkbox", { name: "Costs" }).click();
  const preview = dialog.getByRole("article", { name: /itinerary handout/ });
  await preview.getByText("Prepared by Siam Family Tours").waitFor();
  await preview.getByText("Day 1 total").waitFor();
  await preview.getByText("Sanam Chai").first().waitFor();
  assert.equal(await preview.getByText(/^Day 2/).count(), 0, "the handout follows the day filter");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/handout-dialog-${tag}.png` });
  if (width >= 1000) {
    await page.emulateMedia({ media: "print" });
    await page.pdf({ path: `${output}/handout-${tag}.pdf`, format: "A4", printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: "screen" });
  }
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await dialog.waitFor({ state: "hidden" });

  // A row returns to the plan with that card in view; Back reopens the table.
  await table().getByRole("button", { name: "Stop 4: Jay Fai" }).click();
  await table().waitFor({ state: "detached" });
  assert.doesNotMatch(page.url(), /view=table/);
  await page.locator("#trip-item-jay-fai").waitFor();
  assert.ok(await page.locator("#trip-item-jay-fai").isVisible());
  await page.goBack();
  await table().waitFor();

  // Keyboard: the view switch is reachable and returns to the plan.
  const planButton = table().getByRole("button", { name: "Plan", exact: true });
  await planButton.focus();
  await page.keyboard.press("Enter");
  await table().waitFor({ state: "detached" });
  assert.equal(await page.getByRole("group", { name: "Itinerary view" }).getByRole("button", { name: "Plan" }).getAttribute("aria-pressed"), "true");

  await page.getByRole("group", { name: "Itinerary view" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/plan-${tag}.png` });
  assert.deepEqual(writes, [], "viewing the table does not save the plan");
  assert.deepEqual(errors, []);
  console.log("console errors:", consoleErrors);
  console.log(`itinerary table browser check passed (${tag})`);
} catch (error) {
  console.log("console errors:", consoleErrors);
  await page.screenshot({ path: `${output}/failure-${tag}.png` }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
