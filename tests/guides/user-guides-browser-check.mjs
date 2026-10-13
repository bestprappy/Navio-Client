// Local fixture-backed user-guide writing and discovery check. No account or database writes.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { seed, responseFor } from "../admin/guide-browser-fixture.mjs";
const { chromium } = await import(
  process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright"
);
const origin = process.env.NAVIO_GUIDE_TEST_ORIGIN ?? "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
assert.ok(process.env.AUTH_SECRET);
const output =
  process.env.NAVIO_GUIDE_SCREENSHOTS ?? ".next/user-guide-screenshots";
await mkdir(output, { recursive: true });
const owners = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
];
const library = new Map();
const firstId = "8f2b6c1e-5d3a-4c7b-9e1f-2a6d4b8c0e11";
library.set(firstId, {
  ...structuredClone(seed),
  id: firstId,
  owner: owners[0],
  name: "Bangkok beyond the main streets",
  status: "DRAFT",
  publishedAt: null,
});
library.set("8f2b6c1e-5d3a-4c7b-9e1f-2a6d4b8c0e12", {
  ...structuredClone(seed),
  id: "8f2b6c1e-5d3a-4c7b-9e1f-2a6d4b8c0e12",
  owner: owners[1],
  name: "A weekend in Bangkok",
  status: "PUBLISHED",
  publishedAt: seed.updatedAt,
});
const summaries = (guide) => ({
  ...guide,
  destinationName: guide.destination.name,
  destinationProvider: guide.destination.provider,
  destinationPlaceId: guide.destination.providerPlaceId,
  placeCount: 24,
  author: {
    displayName: guide.owner === owners[0] ? "Traveler One" : "Traveler Two",
  },
});
const pageOf = (content, page, size) => ({
  content: content.slice(page * size, (page + 1) * size),
  number: page,
  totalElements: content.length,
  totalPages: Math.ceil(content.length / size),
  last: (page + 1) * size >= content.length,
});
const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#368489"/><path d="M0 350L180 290L260 330L420 140L540 270L800 210V500H0" fill="#285464"/><path d="M0 420L800 340V500H0" fill="#9EBFC4"/></svg>')}`;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
async function contextFor(
  owner,
  viewport = { width: 1440, height: 960 },
  colorScheme = "light",
) {
  const context = await browser.newContext({
    viewport,
    colorScheme,
    reducedMotion: "reduce",
  });
  if (owner) {
    const claims = Buffer.from(
      JSON.stringify({ sub: owner, realm_access: { roles: ["USER"] } }),
    ).toString("base64url");
    const cookie = await encode({
      secret: process.env.AUTH_SECRET,
      salt: "authjs.session-token",
      token: {
        sub: owner,
        name: "Traveler One",
        accessToken: `test.${claims}.test`,
        accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
    });
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: cookie,
        url: origin,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }
  await context.route("**/api/trips**", (route) =>
    route.fulfill({ json: pageOf([], 0, 20) }),
  );
  await context.route("**/api/shared-plans**", (route) =>
    route.fulfill({ json: pageOf([], 0, 20) }),
  );
  await context.route("**/api/users/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/users/me/guides"))
      return route.fulfill({
        json: {
          id: owner,
          displayName: "Traveler One",
          email: "traveler@example.invalid",
          status: "active",
          roles: ["USER"],
          preferences: {},
        },
      });
    if (!owner)
      return route.fulfill({ status: 401, json: { message: "Sign in" } });
    const parts = url.pathname
      .replace("/api/users/me/guides", "")
      .split("/")
      .filter(Boolean);
    const method = request.method();
    if (!parts.length && method === "GET") {
      const term = url.searchParams.get("term")?.toLowerCase() ?? "";
      return route.fulfill({
        json: pageOf(
          [...library.values()]
            .filter(
              (guide) =>
                guide.owner === owner &&
                `${guide.name} ${guide.country}`.toLowerCase().includes(term),
            )
            .map(summaries),
          Number(url.searchParams.get("page")),
          Number(url.searchParams.get("size")),
        ),
      });
    }
    if (!parts.length && method === "POST") {
      const { content, ...fields } = request.postDataJSON().guide;
      const now = new Date().toISOString();
      const guide = {
        ...fields,
        ...content,
        id: randomUUID(),
        owner,
        status: "DRAFT",
        version: 0,
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
        updatedByName: "Traveler One",
      };
      library.set(guide.id, guide);
      return route.fulfill({ status: 201, json: responseFor(guide) });
    }
    const guide = library.get(parts[0]);
    if (!guide || guide.owner !== owner)
      return route.fulfill({
        status: 404,
        json: { message: "Guide not found" },
      });
    if (method === "GET") return route.fulfill({ json: responseFor(guide) });
    const body =
      method === "DELETE"
        ? { expectedVersion: Number(url.searchParams.get("expectedVersion")) }
        : request.postDataJSON();
    if (body.expectedVersion !== guide.version)
      return route.fulfill({
        status: 409,
        json: { message: "Saved in another session" },
      });
    if (method === "DELETE") {
      library.delete(guide.id);
      return route.fulfill({ status: 204 });
    }
    if (method === "PUT") {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const { content, ...fields } = body.guide;
      Object.assign(guide, fields, content);
    }
    if (parts[1] === "publish") {
      guide.status = "PUBLISHED";
      guide.publishedAt = new Date().toISOString();
    }
    if (parts[1] === "unpublish") {
      guide.status = "DRAFT";
      guide.publishedAt = null;
    }
    guide.version += 1;
    guide.updatedAt = new Date().toISOString();
    guide.updatedByName = owner === owners[0] ? "Traveler One" : "Traveler Two";
    return route.fulfill({ json: responseFor(guide) });
  });
  await context.route("**/api/traveler-guides**", (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split("/")[3];
    if (id) {
      const guide = library.get(id);
      if (!guide || guide.status !== "PUBLISHED")
        return route.fulfill({
          status: 404,
          json: { message: "Guide not found" },
        });
      const response = responseFor(guide);
      return route.fulfill({
        json: {
          id,
          guide: response.guide,
          author: summaries(guide).author,
          publishedAt: guide.publishedAt,
          updatedAt: guide.updatedAt,
        },
      });
    }
    const term = url.searchParams.get("term")?.toLowerCase() ?? "";
    return route.fulfill({
      json: pageOf(
        [...library.values()]
          .filter(
            (guide) =>
              guide.status === "PUBLISHED" &&
              `${guide.name} ${guide.country} ${guide.destination.name}`
                .toLowerCase()
                .includes(term),
          )
          .map(summaries),
        Number(url.searchParams.get("page")),
        Number(url.searchParams.get("size")),
      ),
    });
  });
  await context.route("**/api/geo/places/**", (route) => {
    const url = new URL(route.request().url());
    const id = decodeURIComponent(url.pathname.split("/").at(-1));
    if (id === "destinations")
      return route.fulfill({
        json: {
          items: [
            {
              provider: "GOOGLE",
              providerPlaceId: "ChIJ-chiang-mai-test",
              mainText: "Chiang Mai",
              secondaryText: "Thailand",
              types: ["locality"],
            },
          ],
        },
      });
    if (id === "autocomplete")
      return route.fulfill({
        json: {
          items: [
            {
              provider: "GOOGLE",
              providerPlaceId: "ChIJ-temple-test",
              mainText: "Wat Phra That Doi Suthep",
              secondaryText: "Chiang Mai, Thailand",
              types: ["buddhist_temple"],
            },
          ],
        },
      });
    return route.fulfill({
      json: {
        provider: "GOOGLE",
        providerPlaceId: id,
        name:
          id === "ChIJ-chiang-mai-test"
            ? "Chiang Mai"
            : id === "ChIJ-temple-test"
              ? "Wat Phra That Doi Suthep"
              : "Bangkok place",
        address: "Thailand",
        location: { lat: 18.79, lng: 98.98, placeId: id },
        photoUrl: PHOTO,
        openingHours: {},
        rating: 4.7,
        reviewCount: 100,
      },
    });
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90_000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page };
}
async function noOverflow(page, label) {
  assert.ok(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
    label,
  );
}
try {
  const writer = await contextFor(owners[0]);
  const page = writer.page;
  await page.goto(`${origin}/dashboard`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("heading", { name: "Your Guides", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Your Guides", exact: true })
      .count(),
    0,
  );
  await page
    .getByRole("heading", { name: "Explore guides", exact: true })
    .waitFor();
  await page.screenshot({
    path: `${output}/dashboard-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: /Bangkok beyond/ }).click();
  await page
    .getByRole("textbox", { name: "Guide description" })
    .fill("Saving the first sentence.");
  await page.waitForRequest(
    (request) =>
      request.url().includes("/api/users/me/guides/") &&
      request.method() === "PUT",
  );
  await page
    .getByRole("textbox", { name: "Guide description" })
    .fill("Walk slowly and leave time for the river.");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByText("Published", { exact: true }).waitFor();
  assert.equal(
    await page.getByText("By the Navio team", { exact: true }).count(),
    0,
  );
  assert.equal(
    library.get(firstId).description,
    "Walk slowly and leave time for the river.",
  );
  await page.screenshot({
    path: `${output}/editor-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Read guide", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Bangkok beyond the main streets",
      exact: true,
    })
    .waitFor();
  await page.getByText("By Traveler One", { exact: true }).waitFor();
  const geometry = await page.evaluate(() => {
    const left = document
      .getElementById("guide-reading-panel")
      .getBoundingClientRect();
    const right = document
      .getElementById("guide-map-panel")
      .getBoundingClientRect();
    return {
      left: left.left,
      right: right.right,
      bottom: right.bottom,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
    };
  });
  assert.ok(
    geometry.left <= 1 &&
      Math.abs(geometry.right - geometry.viewportWidth) <= 1,
    "Reader fills the viewport width",
  );
  assert.ok(
    Math.abs(geometry.bottom - geometry.viewportHeight) <= 1,
    "Map reaches the viewport bottom",
  );
  const beforeScroll = await page.locator("#guide-map-panel").boundingBox();
  await page.locator("#guide-reading-panel").evaluate((element) => {
    element.scrollTop = 600;
  });
  assert.deepEqual(
    await page.locator("#guide-map-panel").boundingBox(),
    beforeScroll,
    "Map stays fixed when document scrolls",
  );
  const divider = page.getByRole("separator", { name: "Resize guide panel" });
  await divider.focus();
  const beforeWidth = Number(await divider.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  assert.equal(
    Number(await divider.getAttribute("aria-valuenow")),
    beforeWidth + 2,
  );
  await divider.dblclick();
  await page.locator("#guide-reading-panel").evaluate((element) => {
    element.scrollTop = 0;
  });

  await page.screenshot({
    path: `${output}/reader-desktop.png`,
    fullPage: true,
  });
  await page.goto(`${origin}/dashboard/guides`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("link", { name: /Bangkok beyond/ }).waitFor();
  await page
    .getByRole("button", { name: "Write a guide", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Guide destination" })
    .fill("Chiang");
  await page.getByRole("option", { name: /Chiang Mai/ }).click();
  await page
    .getByRole("button", { name: "Start writing", exact: true })
    .click();
  await page.waitForURL(/\/dashboard\/guides\/[0-9a-f-]{36}$/);
  const newId = new URL(page.url()).pathname.split("/").at(-1);
  assert.equal(library.get(newId).status, "DRAFT");
  await page
    .getByRole("textbox", { name: "Guide title" })
    .fill("My Chiang Mai favorites");
  const region = page.getByRole("region", { name: "Places to visit" });
  await region.getByRole("combobox").fill("Doi");
  await page.getByRole("option", { name: /Doi Suthep/ }).click();
  const preview = page.getByRole("complementary", { name: "Place details" });
  await preview.getByRole("button", { name: "Add to Places to visit" }).click();
  await page
    .getByRole("textbox", { name: "Guide description" })
    .fill("The places I return to every visit.");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByText("Published", { exact: true }).waitFor();
  assert.equal(library.get(newId).name, "My Chiang Mai favorites");
  assert.ok(library.get(newId).body.includes("ChIJ-temple-test"));
  await page.goto(`${origin}/explore?tab=guides`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("tab", { name: "Guides", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("tab", { name: "Guides", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  await page
    .getByRole("textbox", { name: "Search by city, country or title" })
    .fill("Thailand");
  await page.getByRole("link", { name: /My Chiang Mai favorites/ }).waitFor();
  await page.screenshot({
    path: `${output}/explore-desktop.png`,
    fullPage: true,
  });
  await page
    .getByRole("textbox", { name: "Search by city, country or title" })
    .fill("Nowhere");
  await page.getByText("No guides for “Nowhere”").waitFor();
  await page.goto(`${origin}/dashboard/guides/${newId}`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("textbox", { name: "Guide title" }).waitFor();
  await page.getByRole("button", { name: "More guide actions" }).click();
  await page.getByRole("menuitem", { name: "Unpublish", exact: true }).click();
  await page.getByText("Draft", { exact: true }).waitFor();
  await page.getByRole("button", { name: "More guide actions" }).click();
  await page
    .getByRole("menuitem", { name: "Delete guide", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete guide", exact: true })
    .click();
  await page.waitForURL(`${origin}/dashboard/guides`);
  assert.equal(library.has(newId), false);
  const other = await contextFor(owners[1]);
  await other.page.goto(`${origin}/dashboard/guides/${firstId}`, {
    waitUntil: "domcontentloaded",
  });
  await other.page.getByRole("heading", { name: "Guide not found" }).waitFor();
  await other.context.close();
  for (const color of ["light", "dark"]) {
    const mobile = await contextFor(
      owners[0],
      { width: 390, height: 844 },
      color,
    );
    await mobile.page.goto(`${origin}/dashboard`, {
      waitUntil: "domcontentloaded",
    });
    await mobile.page
      .getByRole("heading", { name: "Your Guides", exact: true })
      .waitFor();
    await noOverflow(mobile.page, `dashboard ${color}`);
    await mobile.page.screenshot({
      path: `${output}/dashboard-mobile-${color}.png`,
      fullPage: true,
    });
    await mobile.page.goto(`${origin}/dashboard/guides/${firstId}`, {
      waitUntil: "domcontentloaded",
    });
    await mobile.page.getByRole("textbox", { name: "Guide title" }).waitFor();
    await mobile.page.getByRole("button", { name: "Map", exact: true }).click();
    await mobile.page.getByRole("dialog").waitFor();
    await mobile.page.keyboard.press("Escape");
    assert.equal(await mobile.page.getByRole("dialog").count(), 0);
    await noOverflow(mobile.page, `editor ${color}`);
    await mobile.page.screenshot({
      path: `${output}/editor-mobile-${color}.png`,
      fullPage: true,
    });
    await mobile.page.goto(`${origin}/explore?tab=guides`, {
      waitUntil: "domcontentloaded",
    });
    await mobile.page.getByRole("link", { name: /Bangkok beyond/ }).waitFor();
    await noOverflow(mobile.page, `explore ${color}`);
    await mobile.page.screenshot({
      path: `${output}/explore-mobile-${color}.png`,
      fullPage: true,
    });
    await mobile.page.goto(`${origin}/explore/guides/${firstId}`, {
      waitUntil: "domcontentloaded",
    });
    await mobile.page
      .getByRole("heading", {
        name: "Bangkok beyond the main streets",
        exact: true,
      })
      .waitFor();
    await noOverflow(mobile.page, `reader ${color}`);
    const views = mobile.page.getByRole("group", {
      name: "Guide view",
      exact: true,
    });
    await views.getByRole("button", { name: "Map", exact: true }).click();
    assert.equal(
      await mobile.page.locator("#guide-map-panel").isVisible(),
      true,
    );
    assert.equal(
      await mobile.page.locator("#guide-reading-panel").isVisible(),
      false,
    );
    await mobile.page.getByRole("button", { name: "Show The Grand Palace", exact: true }).waitFor({ timeout: 30_000 });
    const mapHeight = await mobile.page.locator("#guide-map-panel").evaluate((element) => element.getBoundingClientRect().height);
    assert.ok(mapHeight > 600, "Mobile map fills the remaining viewport");
    await mobile.page.screenshot({
      path: `${output}/reader-map-mobile-${color}.png`,
    });
    await views.getByRole("button", { name: "Guide", exact: true }).click();
    assert.equal(
      await mobile.page.locator("#guide-reading-panel").isVisible(),
      true,
    );
    await mobile.page.screenshot({
      path: `${output}/reader-mobile-${color}.png`,
    });
    await mobile.context.close();
  }
  await writer.context.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: dashboard placement, creation, place insertion, autosave, publication, reading, country search, unpublish/delete, owner privacy, desktop/mobile/light/dark",
  );
} finally {
  await browser.close();
}
