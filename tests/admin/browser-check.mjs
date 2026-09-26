// Run against a local dev server with AUTH_SECRET=admin-ui-test-secret-not-for-production.
// NAVIO_PLAYWRIGHT_MODULE can point to an existing Playwright installation.
// Fixture-backed UI verification; this does not exercise Keycloak or PostgreSQL.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { encode } from "next-auth/jwt";
import { historyFixture, STAFF_ID, statisticsFixture, TARGET_ID, userDetailFixture } from "./data.ts";

const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.NAVIO_ADMIN_TEST_ORIGIN ?? "http://localhost:3113";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "Only run against a local test server");
const output = process.env.NAVIO_ADMIN_SCREENSHOTS ?? ".next/admin-screenshots";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function createContext(roles) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
  if (roles) {
    const claims = Buffer.from(JSON.stringify({ sub: STAFF_ID, realm_access: { roles } })).toString("base64url");
    const cookie = await encode({
      secret: "admin-ui-test-secret-not-for-production", salt: "authjs.session-token",
      token: { sub: STAFF_ID, name: "Test Admin", email: "admin@example.com", accessToken: `test.${claims}.test`, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 },
    });
    await context.addCookies([{ name: "authjs.session-token", value: cookie, url: origin, httpOnly: true, sameSite: "Lax" }]);
  }
  await context.route("**/api/trips**", (route) => route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } }));
  await context.route("**/api/users/**", (route) => route.fulfill({ json: { id: STAFF_ID, displayName: "Test Admin", email: "admin@example.com", status: "active", roles: roles ?? [], preferences: {} } }));
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page };
}

try {
  const { context, page } = await createContext(["ADMIN"]);
  const blockedWrite = await context.request.post(`${origin}/api/admin/users/${TARGET_ID}/suspend`, {
    headers: { Origin: "https://other.example" }, data: { reason: "Must not be sent" },
  });
  assert.equal(blockedWrite.status(), 403, "Proxy rejects cross-origin moderation writes");
  const blockedRoute = await context.request.post(`${origin}/api/admin/users/${TARGET_ID}/roles`, { data: { role: "ADMIN" } });
  assert.equal(blockedRoute.status(), 404, "Proxy does not expose role-management routes");
  let account = structuredClone(userDetailFixture);
  let failModeration = true;
  let failHistory = false;
  let failStatistics = false;
  const requests = { statistics: 0, samples: 0, writes: 0 };
  const paged = (content, number = 0, totalElements = content.length) => ({ content, number, size: 20, totalElements, totalPages: Math.ceil(totalElements / 20) });
  await context.route("**/api/admin/users**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith("/statistics")) {
      requests.statistics++;
      return failStatistics
        ? route.fulfill({ status: 403, json: { message: "Unavailable" } })
        : route.fulfill({ json: statisticsFixture });
    }
    if (url.pathname.endsWith("/moderation-events")) {
      const number = Number(url.searchParams.get("page"));
      if (failHistory && number === 1) return route.fulfill({ status: 403, json: { message: "History unavailable" } });
      return route.fulfill({ json: paged(historyFixture.slice(number * 20, number * 20 + 20), number, 21) });
    }
    if (request.method() === "POST") {
      requests.writes++;
      assert.ok(request.postDataJSON().reason.trim().length >= 3);
      if (failModeration) {
        failModeration = false;
        return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      }
      account.status = url.pathname.endsWith("/suspend") ? "suspended" : "active";
      return route.fulfill({ json: { userId: TARGET_ID, status: account.status, reason: request.postDataJSON().reason, expiresAt: null, updatedAt: account.updatedAt } });
    }
    if (url.pathname.endsWith(TARGET_ID)) return route.fulfill({ json: account });
    requests.samples++;
    const status = url.searchParams.get("status")?.toLowerCase();
    const term = url.searchParams.get("term");
    const sample = Number(url.searchParams.get("size")) === 5;
    const row = sample && status === "suspended" ? { ...account, status: "suspended" } : account;
    const rows = (!status || row.status === status) && (!term || row.displayName.toLowerCase().includes(term.toLowerCase())) ? [row] : [];
    return route.fulfill({ json: paged(rows) });
  });

  await page.goto(`${origin}/admin`);
  await page.getByRole("heading", { name: "Admin overview", exact: true }).waitFor({ timeout: 90000 });
  await page.getByRole("list", { name: "Account counts" }).getByText("42", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Refresh overview" }).waitFor();
  await page.waitForFunction(() => !document.querySelector('[aria-label="Refresh overview"]')?.disabled);
  const beforeRefresh = { ...requests };
  await page.getByRole("button", { name: "Refresh overview" }).click();
  await page.waitForFunction(() => !document.querySelector('[aria-label="Refresh overview"]')?.disabled);
  assert.ok(requests.statistics > beforeRefresh.statistics && requests.samples >= beforeRefresh.samples + 2, "Refresh includes both account lists");

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => localStorage.setItem("theme", theme), theme);
      await page.reload();
      await page.getByRole("list", { name: "Account counts" }).waitFor();
      await page.getByRole("link", { name: /Jane jane@example.com Joined/ }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Dashboard overflow at ${width} ${theme}`);
      await page.screenshot({ path: `${output}/dashboard-${width}-${theme}.png`, fullPage: true });
    }
  }
  await page.evaluate(() => localStorage.setItem("theme", "light"));
  await page.reload();
  await page.getByRole("search", { name: "Find an account" }).getByLabel("Find an account").fill("Jane");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL("**/admin/users?q=Jane");
  const accountButton = page.getByRole("button", { name: "Jane jane@example.com" });
  await accountButton.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog", { name: "Jane", exact: true }).waitFor();
  await page.getByRole("button", { name: "Older", exact: true }).click();
  await page.getByText("Oldest history entry", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Newer", exact: true }).click();
  await page.getByText("Reviewed report 1", { exact: false }).first().waitFor();
  failHistory = true;
  await page.getByRole("button", { name: "Older", exact: true }).click();
  await page.getByText("History unavailable", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Newer", exact: true }).click();
  await page.getByText("Reviewed report 1", { exact: false }).first().waitFor();
  failHistory = false;

  await page.getByRole("button", { name: "Ban account", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Ban Jane?", exact: true });
  await confirmation.getByLabel("Reason", { exact: true }).fill("Spam reports confirmed");
  await confirmation.getByRole("button", { name: "Ban account", exact: true }).click();
  await confirmation.getByRole("alert").waitFor();
  assert.match(await confirmation.getByRole("alert").innerText(), /check its current state/);
  assert.equal(account.status, "active");
  await confirmation.getByRole("button", { name: "Ban account", exact: true }).click();
  await confirmation.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Unban account", exact: true }).waitFor();
  assert.equal(requests.writes, 2, "No automatic mutation retries");
  await page.getByRole("button", { name: "Unban account", exact: true }).click();
  const unban = page.getByRole("dialog", { name: "Unban Jane?", exact: true });
  await unban.getByLabel("Reason", { exact: true }).fill("Appeal upheld");
  await unban.getByRole("button", { name: "Unban account", exact: true }).click();
  await unban.waitFor({ state: "hidden" });
  assert.equal(account.status, "active");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.screenshot({ path: `${output}/account-${width}.png`, fullPage: true });
    const sheet = await page.getByRole("dialog", { name: "Jane", exact: true }).boundingBox();
    assert.ok(sheet.x >= 0 && sheet.x + sheet.width <= width + 1, "Sheet fits viewport");
  }
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Jane", exact: true }).waitFor({ state: "hidden" });
  assert.equal(await accountButton.evaluate((element) => element === document.activeElement), true, "Sheet returns keyboard focus to the account");
  await page.getByLabel("Find an account", { exact: true }).fill("Nobody");
  await page.getByText("No accounts match.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Clear search and filter" }).click();
  await accountButton.waitFor();

  failStatistics = true;
  await page.goto(`${origin}/admin`);
  await page.getByRole("alert").waitFor({ timeout: 15000 });
  assert.equal(await page.getByRole("list", { name: "Account counts" }).count(), 0, "Failed statistics never display zero counts");
  failStatistics = false;
  await page.getByRole("button", { name: /try again/i }).click();
  await page.getByRole("list", { name: "Account counts" }).waitFor();
  await context.close();

  for (const roles of [null, ["USER"], ["MODERATOR"]]) {
    const { context: other, page: otherPage } = await createContext(roles);
    if (roles?.includes("MODERATOR")) {
      await other.route("**/api/admin/users**", (route) => route.fulfill({ json: route.request().url().includes("statistics") ? statisticsFixture : paged([]) }));
    }
    await otherPage.goto(`${origin}/admin`);
    if (roles === null) {
      await otherPage.waitForURL("**/sign-in**");
      assert.equal((await other.request.get(`${origin}/api/admin/users`)).status(), 401, "Proxy rejects anonymous account reads");
    }
    else if (roles.includes("USER")) {
      assert.equal(await otherPage.getByRole("heading", { name: "Admin overview", exact: true }).count(), 0);
      await otherPage.getByRole("heading", { name: "This area is for Navio staff", exact: true }).waitFor();
    } else await otherPage.getByRole("heading", { name: "Admin overview", exact: true }).waitFor();
    await other.close();
  }
  assert.deepEqual(errors, []);
  console.log("Admin browser checks passed: refresh, search, history, ban/unban, errors, focus, page gates, responsive themes.");
} finally {
  await browser.close();
}
