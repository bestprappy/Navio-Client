// Fixture-backed admin palette workflow. Run against an isolated Next dev server on port 3113
// started with AUTH_SECRET=admin-ui-test-secret-not-for-production. No real API is called.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { encode } from "next-auth/jwt";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");

const origin = process.env.NAVIO_ADMIN_TEST_ORIGIN ?? "http://localhost:3113";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const output = new URL("./.output/palette/", import.meta.url);
await mkdir(output, { recursive: true });

const now = "2026-10-14T00:00:00Z";
const adminColor = (id, name, hex, sortOrder, retired = false) => ({ id, name, hex, sortOrder, retired, retiredAt: retired ? now : null, createdAt: now, updatedAt: now });

async function run({ theme, width, height }) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", colorScheme: theme });
  const claims = Buffer.from(JSON.stringify({ sub: "00000000-0000-4000-8000-0000000000a1", realm_access: { roles: ["ADMIN"] } })).toString("base64url");
  const cookie = await encode({ secret: "admin-ui-test-secret-not-for-production", salt: "authjs.session-token", token: { sub: "00000000-0000-4000-8000-0000000000a1", name: "Admin", email: "admin@example.com", roles: ["ADMIN"], accessToken: `test.${claims}.test`, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 } });
  await context.addCookies([{ name: "authjs.session-token", value: cookie, url: origin, httpOnly: true, sameSite: "Lax" }]);
  await context.route("**/api/trips**", (route) => route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0 } }));
  await context.route("**/api/users/**", (route) => route.fulfill({ json: { id: "00000000-0000-4000-8000-0000000000a1", displayName: "Admin", email: "admin@example.com", status: "active", roles: ["ADMIN"], preferences: {} } }));

  let colors = [adminColor("teal", "Teal", "#00ae84", 10), adminColor("blue", "Blue", "#008cdf", 20), adminColor("graphite", "Graphite", "#4e535b", 30, true)];
  const writes = [];
  await context.route("**/api/palette-colors", (route) => route.fulfill({ json: colors.map(({ id, name, hex, retired }) => ({ id, name, hex, retired })) }));
  await context.route("**/api/admin/palette-colors**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^.*\/api\/admin\/palette-colors/, "");
    if (request.method() === "GET") return route.fulfill({ json: colors });
    writes.push(`${request.method()} ${path}`);
    if (path === "") {
      const body = request.postDataJSON();
      const created = adminColor(body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), body.name, body.hex.toLowerCase(), 40);
      colors = [...colors, created];
      return route.fulfill({ status: 201, json: created });
    }
    const [, id, action] = path.split("/");
    colors = colors.map((color) => color.id === id ? { ...color, retired: action === "retire", retiredAt: action === "retire" ? now : null } : color);
    return route.fulfill({ json: colors.find((color) => color.id === id) });
  });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${origin}/admin/colors`);
    await page.getByRole("heading", { name: "Color palette", exact: true }).waitFor();
    await page.getByText("2 of 48 colors", { exact: false }).waitFor();
    await page.getByRole("heading", { name: "Removed" }).waitFor();

    // Client-side checks stop bad colors before any request.
    const name = page.getByRole("textbox", { name: "Name", exact: true });
    const hex = page.getByRole("textbox", { name: "Color", exact: true });
    await name.fill("Ghost");
    await hex.fill("#fafafa");
    await page.getByRole("button", { name: "Add color" }).click();
    await page.getByText("disappears on the light or dark background").waitFor();
    await hex.fill("#00AE84");
    await page.getByRole("button", { name: "Add color" }).click();
    await page.getByText("Teal already uses this color.").waitFor();
    await hex.fill("#4e535b");
    await page.getByRole("button", { name: "Add color" }).click();
    await page.getByText("Graphite already uses this color. Restore it instead.").waitFor();
    assert.deepEqual(writes, []);

    await name.fill("Sunset");
    await hex.fill("#E8590C");
    await page.getByRole("button", { name: "Add color" }).click();
    await page.getByRole("status").getByText("Added Sunset.").waitFor();
    await page.getByText("3 of 48 colors", { exact: false }).waitFor();
    await page.screenshot({ path: fileURLToPath(new URL(`added-${theme}-${width}.png`, output)), fullPage: true });

    await page.getByRole("button", { name: "Remove Sunset from the palette" }).click();
    await page.getByText("Removed Sunset. Trips and guides that use it keep it.").waitFor();
    await page.getByRole("button", { name: "Undo" }).click();
    await page.getByText("Sunset is back in the palette.").waitFor();
    await page.getByRole("button", { name: "Restore Graphite" }).click();
    await page.getByText("Graphite is back in the palette.").waitFor();
    assert.deepEqual(writes, ["POST ", "POST /sunset/retire", "POST /sunset/restore", "POST /graphite/restore"]);

    // Keyboard: the hex field is reachable and the add button is a real button.
    await name.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "palette-color-hex");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `horizontal overflow ${overflow}px`);
    await page.screenshot({ path: fileURLToPath(new URL(`final-${theme}-${width}.png`, output)), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(`palette admin ok: ${theme} ${width}px`);
  } finally {
    await browser.close();
  }
}

await run({ theme: "light", width: 1440, height: 900 });
await run({ theme: "dark", width: 390, height: 844 });
