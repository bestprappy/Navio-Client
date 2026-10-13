// Fixture-backed check of the admin Guides Builder against a local dev server.
// Run from client/: node --env-file=.env.local tests/admin/guides-browser-check.mjs
// The session cookie is signed with the server's own AUTH_SECRET; place and destination
// APIs are stubbed, so no backend is needed. Photos are fixture images, not Google's.
// NAVIO_PLAYWRIGHT_MODULE can point to an existing Playwright installation.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { encode } from "next-auth/jwt";
import { installGuideRoutes, SEED_ID } from "./guide-browser-fixture.mjs";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.NAVIO_ADMIN_TEST_ORIGIN ?? "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "Only run against a local server");
const secret = process.env.NAVIO_ADMIN_TEST_SECRET ?? process.env.AUTH_SECRET;
assert.ok(secret, "Set AUTH_SECRET (for example with --env-file=.env.local)");
const output = process.env.NAVIO_ADMIN_SCREENSHOTS ?? ".next/admin-screenshots/guides";
await mkdir(output, { recursive: true });

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#3b6e8f"/><stop offset="1" stop-color="#c9a46a"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/></svg>',
)}`;
const FIXTURES = {
  "ChIJ-chiang-mai-test": { name: "Chiang Mai", lat: 18.7883, lng: 98.9853 },
  "ChIJ-doi-suthep-test": { name: "Wat Phra That Doi Suthep", lat: 18.8048, lng: 98.9216, address: "Suthep, Chiang Mai 50200, Thailand" },
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function createPage(viewport, colorScheme = "light") {
  const context = await browser.newContext({ viewport, colorScheme, reducedMotion: "reduce" });
  const claims = Buffer.from(JSON.stringify({ sub: ADMIN_ID, realm_access: { roles: ["USER", "ADMIN"] } })).toString("base64url");
  const cookie = await encode({
    secret,
    salt: "authjs.session-token",
    token: { sub: ADMIN_ID, name: "Test Admin", email: "admin@example.com", accessToken: `test.${claims}.test`, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 },
  });
  await context.addCookies([{ name: "authjs.session-token", value: cookie, url: origin, httpOnly: true, sameSite: "Lax" }]);
  await installGuideRoutes(context);
  await context.route("**/api/trips**", (route) => route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } }));
  await context.route("**/api/users/**", (route) => route.fulfill({ json: { id: ADMIN_ID, displayName: "Test Admin", email: "admin@example.com", status: "active", roles: ["ADMIN"], preferences: {} } }));
  await context.route("**/api/geo/places/**", (route) => {
    const url = new URL(route.request().url());
    const last = decodeURIComponent(url.pathname.split("/").at(-1));
    if (last === "destinations") {
      return route.fulfill({ json: { items: [{ provider: "GOOGLE", providerPlaceId: "ChIJ-chiang-mai-test", mainText: "Chiang Mai", secondaryText: "Thailand", types: ["locality"] }] } });
    }
    if (last === "autocomplete") {
      return route.fulfill({ json: { items: [{ provider: "GOOGLE", providerPlaceId: "ChIJ-doi-suthep-test", mainText: "Wat Phra That Doi Suthep", secondaryText: "Chiang Mai, Thailand", types: ["buddhist_temple"] }] } });
    }
    const fixture = FIXTURES[last] ?? { name: last, lat: 13.75, lng: 100.5 };
    return route.fulfill({
      json: {
        provider: "GOOGLE", providerPlaceId: last, name: fixture.name, address: fixture.address ?? null,
        location: { lat: fixture.lat, lng: fixture.lng, address: fixture.address ?? null, placeId: last },
        phone: null, website: null, photoUrl: PHOTO, openingHours: {}, category: "Buddhist Temple", rating: 4.7, reviewCount: 1200,
      },
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page };
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label}: page scrolls sideways by ${overflow}px`);
}

try {
  const { context, page } = await createPage({ width: 1440, height: 960 });
  await page.goto(`${origin}/admin/guides`);
  await page.evaluate(() => ["navio.admin.guides.v1", "navio.admin.guides.v2"].forEach((key) => localStorage.removeItem(key)));
  await page.reload();

  // Dashboard: the seed guide sits under its country.
  await page.getByRole("heading", { name: "Thailand", level: 2 }).waitFor();
  await page.getByRole("link", { name: /Bangkok/ }).waitFor();
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Guides" }).waitFor();
  await page.screenshot({ path: `${output}/dashboard.png`, fullPage: true });

  // Typing filters the guides; a new destination starts a guide.
  const search = page.getByRole("combobox", { name: "Guide destination" });
  await search.fill("Chiang");
  await page.getByText("No guide for “Chiang” yet").waitFor();
  await page.getByRole("option", { name: /Chiang Mai/ }).click();
  await page.getByRole("button", { name: "Start writing" }).click();
  await page.waitForURL(/\/admin\/guides\/[0-9a-f-]{36}/);

  // New guide: three empty lists, one per default category.
  await page.getByRole("textbox", { name: "Guide title" }).waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Guide title" }).inputValue(), "Chiang Mai");
  for (const name of ["Places to visit", "Places to eat", "Places to stay"]) {
    await page.getByRole("region", { name }).waitFor();
  }

  // Find a place: it shows pending on the map, in the planner's preview, ready to add there.
  const visit = page.getByRole("region", { name: "Places to visit" });
  await visit.getByRole("combobox").fill("Doi");
  await page.getByRole("option", { name: /Doi Suthep/ }).click();
  await page.getByRole("button", { name: /not added yet/ }).waitFor({ timeout: 15_000 });
  const preview = page.getByRole("complementary", { name: "Place details" });
  await preview.getByText("Not in the guide yet").waitFor();
  await preview.getByRole("button", { name: "Add to Places to visit" }).click();

  // The place is now a card block in the text, numbered on the map.
  const card = page.getByRole("button", { name: "Show Wat Phra That Doi Suthep on the map" });
  await card.waitFor();
  await page.getByRole("button", { name: "Places to visit 1: Wat Phra That Doi Suthep" }).waitFor();
  await preview.getByText("Places to visit 1").waitFor();

  // Text is written straight under the card, in the editor itself.
  await page.locator('[data-embed="guidePlace"] + p').first().click();
  await page.keyboard.type("Take the red songthaew from Chiang Mai Zoo, then climb the 306 steps.");

  // Tags are edited on the card itself.
  await page.getByRole("textbox", { name: "Add a tag to Wat Phra That Doi Suthep" }).first().fill("Viewpoint");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Remove tag Viewpoint" }).first().waitFor();

  // A second place found again cannot be added to the same list twice.
  await visit.getByRole("combobox").fill("Doi");
  await page.getByRole("option", { name: /Doi Suthep/ }).click();
  await preview.getByRole("button", { name: "Already in this list" }).waitFor();
  await preview.getByRole("button", { name: "Close place preview" }).click();

  // A new category, then a new list from the slash menu.
  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Cafes");
  await page.locator('label[title="Cafe"]').click();
  assert.ok(await page.getByRole("radio", { name: "Cafe" }).isChecked(), "Clicking an icon picks it");
  await page.getByRole("button", { name: "Add category", exact: true }).last().click();
  await page.getByRole("button", { name: /^Cafes, 0 lists/ }).waitFor();

  const editor = page.getByRole("textbox", { name: "Chiang Mai guide" });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/place");
  await page.getByRole("option", { name: "Place list" }).waitFor();
  await page.keyboard.press("Enter");
  await page.getByRole("region", { name: "Cafes" }).waitFor();
  assert.ok(await page.getByRole("region", { name: "Cafes" }).getByRole("combobox").evaluate((element) => element === document.activeElement), "A new list's search takes focus");

  // "/card" adds a card that picks its own place, numbered in the list it sits in.
  await editor.focus();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/card");
  await page.getByRole("option", { name: "Place card" }).waitFor();
  await page.keyboard.press("Enter");
  const cardSearch = page.getByRole("combobox", { name: "Find a place in Chiang Mai for this card" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Find a place in Chiang Mai for this card");
  await cardSearch.fill("Doi");
  await page.getByRole("option", { name: /Doi Suthep/ }).click();
  await page.getByRole("button", { name: "Cafes 1: Wat Phra That Doi Suthep" }).waitFor();

  // Found again from the Cafes list, it is already there; the map's preview sends it to another list.
  await page.getByRole("region", { name: "Cafes" }).getByRole("combobox").fill("Doi");
  await page.getByRole("option", { name: /Doi Suthep/ }).click();
  await preview.getByRole("button", { name: "Already in this list" }).waitFor();
  await preview.getByRole("button", { name: /change list/ }).click();
  await page.getByRole("menuitem", { name: "Places to stay" }).click();
  await preview.getByRole("button", { name: "Add to Places to stay" }).click();
  await page.getByRole("button", { name: "Places to stay 1: Wat Phra That Doi Suthep" }).waitFor();
  await page.screenshot({ path: `${output}/editor-new-guide.png` });

  // Everything survives a reload, the text under the card included.
  await page.waitForFunction(() => !document.body.innerText.includes("Unsaved changes") && !document.body.innerText.includes("Saving…"));
  await page.reload();
  await page.getByRole("region", { name: "Cafes" }).waitFor();
  await page.getByText("Take the red songthaew from Chiang Mai Zoo, then climb the 306 steps.").waitFor();
  await page.getByRole("button", { name: "Remove tag Viewpoint" }).first().waitFor();
  assert.equal(await page.locator('[data-embed="guidePlace"]').count(), 3);

  // The seeded Bangkok guide: 24 planner-style cards, each with its write-up underneath.
  await page.goto(`${origin}/admin/guides/${SEED_ID}`);
  await page.getByRole("region", { name: "Places to visit" }).waitFor();
  assert.equal(await page.locator('[data-embed="guidePlace"]').count(), 24);
  await page.getByText(/Emerald Buddha at Wat Phra Kaew/).waitFor();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${output}/editor-bangkok.png` });
  await page.getByRole("button", { name: "Top places to eat 3: Somtam Nua" }).click();
  await page.getByRole("button", { name: "Show Somtam Nua on the map", pressed: true }).waitFor();
  await preview.getByText("Top places to eat 3").waitFor();
  await page.screenshot({ path: `${output}/editor-bangkok-selected.png` });
  await assertNoHorizontalOverflow(page, "desktop editor");
  await context.close();

  const dark = await createPage({ width: 1440, height: 960 }, "dark");
  await dark.page.goto(`${origin}/admin/guides/${SEED_ID}`);
  await dark.page.getByRole("region", { name: "Places to visit" }).waitFor();
  await dark.page.waitForTimeout(1500);
  await dark.page.screenshot({ path: `${output}/editor-bangkok-dark.png` });
  await dark.page.goto(`${origin}/admin/guides`);
  await dark.page.getByRole("heading", { name: "Thailand", level: 2 }).waitFor();
  await dark.page.screenshot({ path: `${output}/dashboard-dark.png`, fullPage: true });
  await dark.context.close();

  const phone = await createPage({ width: 390, height: 844 });
  await phone.page.goto(`${origin}/admin/guides`);
  await phone.page.getByRole("heading", { name: "Thailand", level: 2 }).waitFor();
  await assertNoHorizontalOverflow(phone.page, "phone dashboard");
  await phone.page.screenshot({ path: `${output}/dashboard-phone.png`, fullPage: true });
  await phone.page.goto(`${origin}/admin/guides/${SEED_ID}`);
  await phone.page.getByRole("region", { name: "Places to visit" }).waitFor();
  await assertNoHorizontalOverflow(phone.page, "phone editor");
  await phone.page.screenshot({ path: `${output}/editor-phone.png` });
  await phone.page.getByRole("button", { name: "Map", exact: true }).click();
  await phone.page.getByRole("dialog", { name: "Bangkok on the map" }).waitFor();
  await phone.page.waitForTimeout(1500);
  await phone.page.screenshot({ path: `${output}/editor-phone-map.png` });
  await phone.context.close();

  assert.deepEqual(errors, [], "No page errors");
  console.log(`Guides browser check passed. Screenshots in ${output}`);
} finally {
  await browser.close();
}
