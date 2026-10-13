import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";
import { installGuideRoutes, library, seed } from "./guide-browser-fixture.mjs";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.NAVIO_ADMIN_TEST_ORIGIN ?? "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
assert.ok(process.env.AUTH_SECRET);
const guideId = "9f2b6c1e-5d3a-4c7b-9e1f-2a6d4b8c0e02";
library.set(guideId, { ...structuredClone(seed), id: guideId, name: "Shared guide", status: "DRAFT", publishedAt: null });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
async function admin(number) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const sub = `00000000-0000-4000-8000-00000000000${number}`;
  const claims = Buffer.from(JSON.stringify({ sub, realm_access: { roles: ["USER", "ADMIN"] } })).toString("base64url");
  const cookie = await encode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: { sub, name: `Admin ${number}`, accessToken: `test.${claims}.test`, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
  await context.addCookies([{ name: "authjs.session-token", value: cookie, url: origin, httpOnly: true, sameSite: "Lax" }]);
  await context.route("**/api/trips**", (route) => route.fulfill({ json: { content: [], totalElements: 0 } }));
  await context.route("**/api/users/**", (route) => route.fulfill({ json: { id: sub, displayName: `Admin ${number}`, roles: ["ADMIN"] } }));
  await context.route("**/api/geo/places/**", (route) => route.fulfill({ json: { provider: "GOOGLE", providerPlaceId: "place", name: "Place", location: { lat: 13.75, lng: 100.5 }, openingHours: {}, photoUrl: null } }));
  await installGuideRoutes(context);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/admin/guides`);
  await page.getByRole("link", { name: /Shared guide/ }).click();
  await page.getByRole("textbox", { name: "Guide description" }).waitFor();
  return { page, context };
}
try {
  const first = await admin(1);
  const second = await admin(2);
  // Publish immediately after editing: the action must use the version returned by autosave.
  await first.page.getByRole("textbox", { name: "Guide description" }).fill("Created by one admin, shared with every admin.");
  await first.page.getByRole("button", { name: "Publish", exact: true }).click();
  await first.page.getByText("Published", { exact: true }).waitFor();
  assert.equal(library.get(guideId).description, "Created by one admin, shared with every admin.");
  assert.equal(library.get(guideId).status, "PUBLISHED");
  // Second admin still has the old version. Their edits must be kept and the server copy must survive.
  await second.page.getByRole("textbox", { name: "Guide title" }).fill("Stale overwrite");
  await second.page.getByRole("button", { name: "Reload latest guide" }).waitFor();
  assert.equal(library.get(guideId).name, "Shared guide");
  await second.page.getByRole("button", { name: "Reload latest guide" }).click();
  await second.page.waitForFunction(() => document.querySelector('[aria-label="Guide title"]')?.value === "Shared guide");
  assert.equal(await second.page.getByRole("textbox", { name: "Guide description" }).inputValue(), "Created by one admin, shared with every admin.");
  // The other admin can update publication and delete the same guide.
  await second.page.getByRole("textbox", { name: "Guide description" }).fill("Updated by the second admin.");
  await second.page.getByRole("button", { name: "More guide actions" }).click();
  await second.page.getByRole("menuitem", { name: "Unpublish", exact: true }).click();
  await second.page.getByText("Draft", { exact: true }).waitFor();
  assert.equal(library.get(guideId).description, "Updated by the second admin.");
  await second.page.getByRole("textbox", { name: "Guide description" }).fill("Final edit before deletion.");
  await second.page.getByRole("button", { name: "More guide actions" }).click();
  await second.page.getByRole("menuitem", { name: "Delete guide", exact: true }).click();
  await second.page.getByRole("dialog").getByRole("button", { name: "Delete guide", exact: true }).click();
  await second.page.waitForURL(`${origin}/admin/guides`);
  assert.equal(library.has(guideId), false);
  await first.context.close(); await second.context.close();
  assert.deepEqual(errors, []);
  console.log("PASS: shared admin library, immediate-save publish/unpublish/delete, concurrent edit conflict and reload");
} finally { await browser.close(); }
