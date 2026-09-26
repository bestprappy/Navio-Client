// Fixture-backed admin workflow. Run against an isolated Next dev server on port 3113.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { encode } from "next-auth/jwt";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");

const origin = process.env.NAVIO_ADMIN_TEST_ORIGIN ?? "http://localhost:3113";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const claims = Buffer.from(JSON.stringify({ sub: "00000000-0000-4000-8000-0000000000a1", realm_access: { roles: ["ADMIN"] } })).toString("base64url");
const cookie = await encode({ secret: "admin-ui-test-secret-not-for-production", salt: "authjs.session-token", token: { sub: "00000000-0000-4000-8000-0000000000a1", name: "Admin", email: "admin@example.com", accessToken: `test.${claims}.test`, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
await context.addCookies([{ name: "authjs.session-token", value: cookie, url: origin, httpOnly: true, sameSite: "Lax" }]);
await context.route("**/api/trips**", (route) => route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0 } }));
await context.route("**/api/users/**", (route) => route.fulfill({ json: { id: "00000000-0000-4000-8000-0000000000a1", displayName: "Admin", email: "admin@example.com", status: "active", roles: ["ADMIN"], preferences: {} } }));
const fields = { make: "Navio", model: "Test EV", trim: "", year: null, market: "TH", batteryCapacityKwh: null, batteryCapacityBasis: "UNKNOWN", rangeKm: null, rangeStandard: null, connectorTypes: [], maxAcKw: null, maxDcKw: null, imageUrl: null, sourceUrl: null, verifiedAt: null };
let entry = null;
await context.route("**/api/admin/vehicle-models**", (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (request.method() === "POST" && url.pathname.endsWith("/vehicle-models")) {
    const body = request.postDataJSON();
    assert.equal(body.specification.make, "Navio");
    entry = { id: "test-ev", status: "DRAFT", version: 0, specification: body.specification, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return route.fulfill({ status: 201, json: entry });
  }
  if (url.pathname.endsWith("/test-ev")) return route.fulfill({ json: entry });
  return route.fulfill({ json: { content: entry ? [entry] : [], number: 0, totalElements: entry ? 1 : 0, totalPages: entry ? 1 : 0 } });
});
await context.route("**/api/admin/audit-events**", (route) => route.fulfill({ json: { content: [{ id: "00000000-0000-4000-8000-0000000000f1", action: "VEHICLE_MODEL_CREATED", resourceType: "VEHICLE_MODEL", resourceId: "00000000-0000-4000-8000-0000000000f2", actorUserId: "00000000-0000-4000-8000-0000000000a1", actorDisplayName: "Admin", createdAt: new Date().toISOString(), before: {}, after: { make: "Navio", model: "Test EV" } }], number: 0, totalElements: 1, totalPages: 1 } }));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(`${origin}/admin/vehicles`);
  await page.getByRole("heading", { name: "Vehicle catalog", exact: true }).waitFor();
  await page.getByText("No vehicles in this view.").waitFor();
  await page.getByRole("link", { name: "Add vehicle" }).click();
  await page.getByRole("textbox", { name: "Make" }).fill("Navio");
  await page.getByRole("textbox", { name: "Model" }).fill("Test EV");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.waitForURL("**/admin/vehicles/test-ev", { timeout: 12000 }).catch(async (error) => {
    console.error((await page.locator("main").innerText()).slice(0, 1400));
    throw error;
  });
  assert.equal(entry?.status, "DRAFT");
  await page.goto(`${origin}/admin/activity`);
  await page.getByRole("heading", { name: "Activity", exact: true }).waitFor();
  await page.getByText("Vehicle model created").waitFor();
  await page.getByText("1 matching events").waitFor();
  await page.getByText("2 changed fields").click();
  await page.getByText("Test EV").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await mkdir(".next/admin-screenshots", { recursive: true });
  await page.screenshot({ path: ".next/admin-screenshots/catalog-activity-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
