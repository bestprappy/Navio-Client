// Checks that a guide written in the admin console is what travelers see in the planner.
// Run from client/: node --env-file=.env.local tests/admin/guides-planner-check.mjs
// Every planner and account API is intercepted; nothing is written to a backend.
// NAVIO_PLAYWRIGHT_MODULE can point to an existing Playwright installation.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { registerHooks } from "node:module";
import { encode } from "next-auth/jwt";

registerHooks({ resolve(specifier, context, nextResolve) {
  const fromApp = !context.parentURL?.includes("node_modules");
  if (fromApp && specifier.startsWith(".") && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });

const { BANGKOK_ADMIN_GUIDE, paragraphMarkdown } = await import("../../app/feature/admin/_components/guides/data.ts");
const { journeyDay } = await import("../planner/travel-options/data.ts");

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Only run against a local server");
const secret = process.env.AUTH_SECRET;
assert.ok(secret, "Set AUTH_SECRET (for example with --env-file=.env.local)");
const output = process.env.NAVIO_ADMIN_SCREENSHOTS ?? ".next/admin-screenshots/guides";
await mkdir(output, { recursive: true });

// The Bangkok guide as an admin edited it: a renamed category and a new write-up under the Grand Palace.
const originalWriteUp = paragraphMarkdown(BANGKOK_ADMIN_GUIDE.body.split("\n\n")[3].replace(/\\/g, ""));
const writtenGuide = {
  ...BANGKOK_ADMIN_GUIDE,
  categories: BANGKOK_ADMIN_GUIDE.categories.map((category) => (category.id === "visit" ? { ...category, name: "Temples and sights", iconId: "camera" } : category)),
  body: BANGKOK_ADMIN_GUIDE.body
    .replace(BANGKOK_ADMIN_GUIDE.body.split("\n\n")[3], 'Written in the admin console: go at <span data-color="red">opening time</span>.')
    .replace(
      BANGKOK_ADMIN_GUIDE.body.split("\n\n")[1],
      `${BANGKOK_ADMIN_GUIDE.body.split("\n\n")[1]}\n\n> [!TIP]\n>\n> Buy a Rabbit card for the BTS.\n\n${"```"}\nBTS Sukhumvit line\n${"```"}`,
    ),
};
assert.notEqual(writtenGuide.body, BANGKOK_ADMIN_GUIDE.body, `The fixture edits the Grand Palace write-up (${originalWriteUp.slice(0, 30)}…)`);

const planId = "a1000000-0000-4000-8000-000000000077";
const stamp = new Date().toISOString();
const bangkokDay = { ...journeyDay, destination: { id: BANGKOK_ADMIN_GUIDE.destination.providerPlaceId, name: "Bangkok", lat: 13.7563, lng: 100.5018, country: "Thailand" } };
const snapshot = { version: 1, savedAt: stamp, blocks: [bangkokDay], budget: { currency: "THB", amount: 0, expenses: [] }, capabilities: ["leg-travel-mode-v1", "cycling-legs-v1", "transit-preferences-v1", "transit-route-choice-v1", "trip-energy-v1", "trip-garage-v1", "observed-soc-v1", "day-destinations", "day-anchors", "charge-targets", "precise-charging-v1"] };
const trip = { id: planId, displayName: "Bangkok guide test", title: "Bangkok guide test", destinationId: "bangkok", destinationName: "Bangkok", destinationCountry: "Thailand", destinationLat: 13.75, destinationLng: 100.53, startDate: "2026-10-13", endDate: "2026-10-13", visibility: "PRIVATE", createdAt: stamp, updatedAt: stamp };
const userId = "22222222-2222-4222-8222-222222222222";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  context.setDefaultTimeout(30_000);
  const cookie = await encode({ secret, salt: "authjs.session-token", token: { sub: userId, name: "Test traveller", accessToken: "synthetic-test-only", accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
  await context.addCookies([{ name: "authjs.session-token", value: cookie, url: base, httpOnly: true, sameSite: "Lax" }]);
  await context.addInitScript((guides) => {
    localStorage.setItem("navio.admin.guides.v2", guides);
  }, JSON.stringify([writtenGuide]));
  await context.route(`${base}/api/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/api/auth/")) return route.continue();
    if (path === "/api/guides") {
      const { categories, lists, places, body, id, publishedAt, updatedAt, ...fields } = writtenGuide;
      return route.fulfill({ json: { content: [{ id, publishedAt, updatedAt, guide: { ...fields, content: { categories, lists, places, body } } }], totalElements: 1, totalPages: 1, number: 0 } });
    }
    if (path === `/api/trips/${planId}/planner`) return route.fulfill({ json: snapshot });
    if (path === `/api/trips/${planId}`) return route.fulfill({ json: trip });
    if (path === "/api/trips") return route.fulfill({ json: { content: [trip], totalElements: 1 } });
    if (path === "/api/users/me") return route.fulfill({ json: { id: userId, displayName: "Test traveller", email: "traveller@example.invalid", locale: "en", countryCode: "TH", roles: ["USER"] } });
    if (path === "/api/users/me/vehicles" || path === "/api/users/me/places") return route.fulfill({ json: [] });
    if (path === "/api/routes/directions") return route.fulfill({ json: { segments: [] } });
    if (path.startsWith("/api/geo/places/")) {
      const id = decodeURIComponent(path.split("/").at(-1));
      return route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: id, name: id, address: null, location: { lat: 13.75, lng: 100.5, address: null, placeId: id }, photoUrl: null, openingHours: {} } });
    }
    if (path.startsWith("/api/shared-plans")) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 } });
    return route.fulfill({ json: { items: [], content: [], totalElements: 0 } });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${base}/planner/${planId}?destinationName=Bangkok&from=2026-10-13&to=2026-10-13&lat=13.75&lng=100.53`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const popular = page.getByRole("region", { name: "Popular places in Bangkok" }).or(page.getByRole("heading", { name: "Popular places in Bangkok" }));
  await popular.first().waitFor({ timeout: 90_000 });
  await page.getByRole("button", { name: "Browse all popular places in Bangkok" }).click();

  await page.getByRole("heading", { name: "Bangkok", level: 1 }).waitFor();
  await page.getByText("By the Navio team").waitFor();
  await page.getByRole("heading", { name: "Temples and sights", level: 2 }).waitFor();
  // The writing reads as it was written: text, colour, callouts and code, outside the cards.
  const writing = page.getByText(/Written in the admin console: go at/);
  await writing.waitFor();
  assert.equal(await writing.locator("xpath=ancestor::article[contains(@class, 'surface-card')]").count(), 0, "The write-up sits under the card, not inside it");
  assert.equal(await page.locator('span[data-color="red"]', { hasText: "opening time" }).count(), 1, "Text colour is kept");
  assert.equal(await page.locator('[data-type="callout"][data-tone="tip"]', { hasText: "Rabbit card" }).count(), 1, "Callouts are kept");
  assert.equal(await page.locator("pre", { hasText: "BTS Sukhumvit line" }).count(), 1, "Code blocks are kept");

  // Cards are the editor's card: photo, rating, type, address and opening hours, plus Add to day.
  const addGrandPalace = page.getByRole("button", { name: /^Add The Grand Palace to/ });
  await addGrandPalace.waitFor();
  const firstCard = addGrandPalace.locator("xpath=ancestor::article[1]");
  await firstCard.getByText("Opening hours").waitFor();
  for (const tag of ["Royal palace", "Temple", "Historic"]) await firstCard.getByText(tag, { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/planner-guide.png` });

  assert.deepEqual(errors, [], "No page errors");
  console.log(`Planner guide check passed. Screenshot in ${output}/planner-guide.png`);
} finally {
  await browser.close();
}
