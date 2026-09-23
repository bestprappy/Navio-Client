// Run with Node 24 against an isolated dev server; public data is mocked.
import assert from "node:assert/strict";
import { destinationFixture, placeFixture } from "./data.ts";
import { catalogFixture } from "../garage/data.ts";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3113";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = [], accountRequests = [];
page.on("pageerror", error => errors.push(error.message));
await context.route("**/api/geo/places/**", route => {
  const path = new URL(route.request().url()).pathname;
  return route.fulfill({ json: path.endsWith("destinations") || path.endsWith("autocomplete")
    ? { items: [destinationFixture] }
    : path.endsWith("search") || path.endsWith("nearby") ? { items: [placeFixture] }
    : path.endsWith("ev-chargers") ? { items: [] } : placeFixture });
});
await context.route("**/api/routes/directions", route => route.fulfill({ json: { segments: [] } }));
for (const pattern of ["**/api/trips**", "**/api/users/**"]) {
  await context.route(pattern, route => {
    if (route.request().method() === "GET" && new URL(route.request().url()).pathname === "/api/users/me/vehicles/catalog") {
      return route.fulfill({ json: [catalogFixture] });
    }
    accountRequests.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return route.fulfill({ status: 401, json: { message: "Authentication required" } });
  });
}
try {
  await page.goto(`${origin}/planner`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("button", { name: "Sign in later", exact: true }).click({ timeout: 90000 });
  assert.equal(new URL(page.url()).pathname, "/dashboard");
  await page.getByRole("link", { name: "Plan a new trip", exact: true }).click();
  await page.getByRole("combobox", { name: "Destination", exact: true }).fill("Bangkok");
  await page.getByRole("option").filter({ hasText: "Bangkok" }).first().click();
  await page.getByRole("button", { name: "Start planning", exact: true }).click();
  await page.getByText("Guest plan · Not saved", { exact: true }).waitFor({ timeout: 90000 });
  assert.match(new URL(page.url()).pathname, /^\/planner\/guest-/);
  await page.getByRole("button", { name: "Edit trip name", exact: true }).click();
  await page.getByLabel("Trip name", { exact: true }).fill("Temporary journey");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page.getByRole("heading", { name: "Temporary journey", exact: true }).waitFor();
  await page.getByRole("combobox", { name: "Add a stop in Bangkok", exact: true }).click();
  await page.getByRole("option").filter({ hasText: "Guest test temple" }).first().click();
  await page.getByText("Guest test temple", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Add to trip", exact: true }).click();
  await page.getByRole("button", { name: /Set where this trip starts/ }).first().click();
  await page.getByRole("button", { name: "Pin on map", exact: true }).click();
  const coordinates = page.getByRole("button", { name: "Enter coordinates", exact: true });
  if (await coordinates.isEnabled() && await coordinates.getAttribute("aria-expanded") === "false") await coordinates.click();
  await page.getByLabel("Latitude", { exact: true }).fill("13.75");
  await page.getByLabel("Longitude", { exact: true }).fill("100.5");
  await page.getByLabel("Place name", { exact: true }).fill("Guest starting point");
  const favorite = page.getByRole("checkbox", { name: "Save to my favorite places for future trips" });
  assert.equal(await favorite.isChecked(), false);
  await favorite.click();
  await page.getByRole("button", { name: "Sign in later", exact: true }).click();
  assert.equal(await favorite.isChecked(), false);
  await page.getByRole("button", { name: "Use this location", exact: true }).click();
  await page.getByRole("button", { name: "Show start: Guest starting point on map", exact: true }).waitFor();
  await page.getByRole("button", { name: "Save to favorites", exact: true }).first().click();
  await page.getByRole("button", { name: "Sign in later", exact: true }).click();
  await page.getByRole("button", { name: "Set battery level", exact: true }).first().click();
  await page.getByLabel("Actual battery at this stop (%)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Apply battery level", exact: true }).click();
  await page.getByRole("button", { name: "Observed battery: 0%", exact: true }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Set battery level", exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Add vehicle", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Thailand catalogue", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("textbox", { name: "Search Thailand vehicles" }).fill("ATTO");
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Use for this trip", exact: true }).click();
  await page.getByText(/Based on 480 km NEDC/).waitFor();
  assert.equal(await page.locator('#energy-selection option[value="RESET_DEFAULT"]').isDisabled(), true);
  await page.getByRole("button", { name: "About NAVIO Estimate" }).focus();
  await page.getByRole("tooltip").waitFor();
  await page.keyboard.press("Escape");
  await page.locator("#starting-battery").fill("65");
  assert.equal(await page.locator("#starting-battery").inputValue(), "65");
  assert.equal(await page.getByRole("button", { name: "Save settings", exact: true }).isDisabled(), true);
  await page.getByLabel("Energy Consumption", { exact: true }).selectOption("USER_OVERRIDE");
  await page.getByLabel("Your average (kWh/100 km)", { exact: true }).fill("17.125");
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  assert.equal(await page.getByLabel("Your average (kWh/100 km)", { exact: true }).inputValue(), "17.125");
  await page.waitForFunction(() => document.querySelector("button[type=submit]")?.disabled === true);
  await page.getByLabel("Energy Consumption", { exact: true }).selectOption("USE_RATED_RANGE");
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  await page.getByText(/Based on 480 km NEDC/).waitFor();
  await page.getByRole("button", { name: "Add vehicle", exact: true }).click();
  await page.getByRole("button", { name: "Custom EV", exact: true }).click();
  for (const [label, value] of [["Make", "Test"], ["Model and trim", "EV"], ["Model year", "2026"], ["Battery capacity (kWh)", "60"], ["Reference range (km)", "400"], ["Your average consumption (kWh/100 km, optional)", "15"]]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole("button", { name: "Use for this trip", exact: true }).click();
  await page.getByText("Vehicle settings used only for this guest trip.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Sign in to save plans", exact: true }).click();
  await page.getByRole("button", { name: "Sign in later", exact: true }).click();
  assert.equal(await page.getByRole("heading", { name: "Temporary journey", exact: true }).count(), 1);
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => /planner.*draft|navio.*planner/i.test(key))), []);
  await page.reload();
  await page.getByRole("button", { name: "Sign in later", exact: true }).click();
  await page.getByText("Guest plan · Not saved", { exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Temporary journey", exact: true }).count(), 0);
  assert.equal(await page.getByText("Vehicle settings used only for this guest trip.", { exact: true }).count(), 0);
  await page.goto(`${origin}/explore`, { waitUntil: "domcontentloaded" });
  for (const action of ["Save", "Like"]) {
    console.log(`Checking guest Explore ${action}`);
    const button = page.getByRole("button", { name: action, exact: true }).first();
    await button.click();
    await page.getByRole("button", { name: "Sign in later", exact: true }).click();
    assert.equal(await button.getAttribute("aria-pressed"), "false");
  }
  await page.goto(`${origin}/planner/11111111-1111-4111-8111-111111111111`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Sign in later", exact: true }).click();
  await page.getByRole("heading", { name: "This is a saved trip", exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/planner/guest-mobile?destinationName=Bangkok&country=Thailand&from=2026-09-13&to=2026-09-15`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Sign in later", exact: true }).click();
  await page.getByText("Guest plan · Not saved", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Sign in to save plans", exact: true }).click();
  await page.getByRole("button", { name: "Sign in later", exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.deepEqual(accountRequests, [], "guest UI must not request or save private account data");
  assert.deepEqual(errors, []);
  console.log("PASS: guest setup, rename, manual map anchor, favorite guards, temporary EV, sign-in-later, refresh reset, Explore gates, private-trip protection; no account requests or browser errors.");
} catch (error) {
  console.error("Browser errors:", errors);
  console.error((await page.locator("body").innerText()).slice(0, 7000));
  throw error;
} finally {
  await browser.close();
}
