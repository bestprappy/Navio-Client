import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { mkdir } from "node:fs/promises";
import { encode } from "next-auth/jwt";
registerHooks({
  resolve(specifier, context, next) {
    return next(
      !context.parentURL?.includes("/node_modules/") &&
        specifier.startsWith(".") &&
        !/\.(ts|tsx|js|mjs|json)$/.test(specifier)
        ? `${specifier}.ts`
        : specifier,
      context,
    );
  },
});
const { BANGKOK_ADMIN_GUIDE } =
  await import("../../app/feature/admin/_components/guides/data.ts");
const { chromium } = await import(
  process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright"
);
const origin = process.env.NAVIO_GUIDE_TEST_ORIGIN ?? "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const output =
  process.env.NAVIO_GUIDE_SCREENSHOTS ?? ".next/user-guide-screenshots";
await mkdir(output, { recursive: true });
const cities = ["Bangkok", "Chiang Mai", "Tokyo", "Kyoto"];
const destinations = cities.map((name, index) => ({
  id: `ChIJcity${index}`,
  name,
  lat: 13.7 + index / 10,
  lng: 100.5,
  country: index < 2 ? "Thailand" : "Japan",
}));
const tripId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const trip = {
  id: tripId,
  ownerId: userId,
  destinationName: "Bangkok",
  destinationCity: "Bangkok",
  destinationCountry: "Thailand",
  destinationCountryCode: "TH",
  startDate: "2026-10-13",
  endDate: "2026-10-16",
  currencyCode: "THB",
  status: "PLANNING",
  createdAt: "2026-10-13T00:00:00Z",
  updatedAt: "2026-10-13T00:00:00Z",
  visibility: "PRIVATE",
};
const snapshot = {
  version: 0,
  blocks: destinations.map((destination, index) => ({
    id: `city-day-${index}`,
    kind: "itinerary",
    title: destination.name,
    date: `2026-10-${13 + index}`,
    colorId: "blue",
    items: [],
    destination,
  })),
  budget: { currency: "THB", amount: 0, expenses: [] },
  savedAt: "2026-10-13T00:00:00Z",
  capabilities: ["day-destinations"],
};
const requested = new Set();
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const cookie = await encode({
    secret: process.env.AUTH_SECRET,
    salt: "authjs.session-token",
    token: {
      sub: userId,
      name: "Test traveler",
      accessToken: "synthetic-test-only",
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
  await context.route(`${origin}/api/**`, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body) => route.fulfill({ json: body });
    if (path.startsWith("/api/auth/")) return route.continue();
    if (path === `/api/trips/${tripId}/planner`) return json(snapshot);
    if (path === `/api/trips/${tripId}`) return json(trip);
    if (path === "/api/trips")
      return json({ content: [trip], totalElements: 1 });
    if (path === "/api/users/me")
      return json({
        id: userId,
        displayName: "Test traveler",
        email: "test@example.invalid",
        roles: ["USER"],
      });
    if (path === "/api/users/me/vehicles" || path === "/api/users/me/places")
      return json([]);
    if (path === "/api/guides") {
      const {
        id,
        categories,
        lists,
        places,
        body,
        publishedAt,
        updatedAt,
        ...fields
      } = BANGKOK_ADMIN_GUIDE;
      return json({
        content: [
          {
            id,
            guide: { ...fields, content: { categories, lists, places, body } },
            publishedAt,
            updatedAt,
          },
        ],
        number: 0,
        totalPages: 1,
        totalElements: 1,
      });
    }
    if (path === "/api/traveler-guides") {
      const country = url.searchParams.get("country");
      if (country) requested.add(country);
      const all = [
        ...destinations,
        { id: "ChIJOsaka", name: "Osaka", country: "Japan" },
        { id: "ChIJJapan", name: "Japan", country: "" },
      ];
      const matches = all.filter((destination) =>
        country
          ? destination.country === country ||
            (!destination.country && destination.name === country)
          : destination.name === url.searchParams.get("city"),
      );
      const content = matches.map((destination) => ({
        id: `8f2b6c1e-5d3a-4c7b-9e1f-2a6d4b8c0e2${all.indexOf(destination)}`,
        name: `${destination.name} from a local`,
        country: destination.country,
        countryCode: destination.country === "Japan" ? "JP" : "TH",
        destinationName: destination.name,
        destinationProvider: "GOOGLE",
        destinationPlaceId: destination.id,
        description: "A traveler-written guide",
        coverPlaceId: `GOOGLE:${destination.id}`,
        placeCount: 3,
        categories: [],
        author: { displayName: "City writer" },
        publishedAt: "2026-10-13T00:00:00Z",
        updatedAt: "2026-10-13T00:00:00Z",
      }));
      const page = Number(url.searchParams.get("page"));
      const size = Number(url.searchParams.get("size"));
      return json({
        content: content.slice(page * size, (page + 1) * size),
        number: page,
        totalPages: Math.ceil(content.length / size),
        totalElements: content.length,
      });
    }
    if (path.startsWith("/api/shared-plans"))
      return json({ content: [], number: 0, last: true, totalElements: 0 });
    if (path.startsWith("/api/geo/places/")) {
      const id = path.split("/").at(-1);
      return json({
        provider: "GOOGLE",
        providerPlaceId: id,
        name: id,
        location: { lat: 13.7, lng: 100.5, placeId: id },
        photoUrl: null,
        openingHours: {},
      });
    }
    if (path === "/api/routes/directions") return json({ segments: [] });
    return json({ items: [], content: [], totalElements: 0 });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    `${origin}/planner/${tripId}?destinationName=Bangkok&from=2026-10-13&to=2026-10-16&lat=13.7&lng=100.5`,
    { timeout: 120_000 },
  );
  await page
    .getByRole("heading", { name: "Guides for your trip", exact: true })
    .waitFor({ timeout: 60_000 });
  for (const name of cities) {
    const country = destinations.find(
      (destination) => destination.name === name,
    ).country;
    await page
      .getByRole("region", { name: `Guides for ${country}`, exact: true })
      .getByRole("link", { name: new RegExp(`${name} from a local`) })
      .waitFor();
  }
  const japan = page.getByRole("region", {
    name: "Guides for Japan",
    exact: true,
  });
  await japan.getByRole("link", { name: /Osaka from a local/ }).waitFor();
  await japan
    .getByRole("button", { name: "Load more guides", exact: true })
    .click();
  await japan.getByRole("link", { name: /Japan from a local/ }).waitFor();
  assert.deepEqual([...requested].sort(), ["Japan", "Thailand"]);
  const carousel = japan.getByRole("region", {
    name: "Published guides for Japan",
    exact: true,
  });
  const previous = carousel.getByRole("button", {
    name: "Previous guide for Japan",
    exact: true,
  });
  const next = carousel.getByRole("button", {
    name: "Next guide for Japan",
    exact: true,
  });
  const firstSlide = carousel.locator('[data-slot="carousel-item"]').first();
  assert.equal(await carousel.locator('[data-slot="carousel-item"]').count(), 4);
  assert.ok(await previous.isDisabled());
  const initialLeft = (await firstSlide.boundingBox()).x;
  await next.click();
  await page.waitForFunction(
    ({ slide, left }) => slide.getBoundingClientRect().left < left - 20,
    { slide: await firstSlide.elementHandle(), left: initialLeft },
  );
  assert.ok(await previous.isEnabled());
  await carousel.focus();
  await page.keyboard.press("ArrowLeft");
  await page.waitForFunction(
    ({ slide, left }) => Math.abs(slide.getBoundingClientRect().left - left) < 2,
    { slide: await firstSlide.elementHandle(), left: initialLeft },
  );
  for (let index = 0; index < 4 && (await next.isEnabled()); index++) {
    await next.click();
  }
  await page.waitForFunction(
    (button) => button.disabled,
    await next.elementHandle(),
  );
  const lastLink = carousel.getByRole("link", { name: /Japan from a local/ });
  const viewport = await carousel.locator('[data-slot="carousel-content"]').boundingBox();
  const lastCard = await lastLink.boundingBox();
  assert.ok(lastCard.x >= viewport.x - 2);
  assert.ok(lastCard.x + lastCard.width <= viewport.x + viewport.width + 2);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) {
      await page
        .getByRole("group", { name: "Planner view", exact: true })
        .getByRole("button", { name: "Itinerary", exact: true })
        .click();
    }
    for (const theme of ["dark", "light"]) {
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
      }, theme);
      await carousel.scrollIntoViewIfNeeded();
      await carousel.focus();
      for (let index = 0; index < 4; index++) {
        await page.keyboard.press("ArrowLeft");
      }
      await page.waitForFunction(
        (button) => button.disabled,
        await previous.elementHandle(),
      );
      const metrics = await carousel.evaluate((element) => {
        const viewport = element.querySelector('[data-slot="carousel-content"]');
        const slides = element.querySelectorAll('[data-slot="carousel-item"]');
        const view = viewport.getBoundingClientRect();
        const first = slides[0].getBoundingClientRect();
        const second = slides[1].getBoundingClientRect();
        return {
          sameRow: Math.abs(first.top - second.top) < 2,
          nextCardPeeks: second.left < view.right && second.right > view.right,
          fits: first.width < view.width,
          pageFits: document.documentElement.scrollWidth <= window.innerWidth,
        };
      });
      assert.deepEqual(metrics, {
        sameRow: true,
        nextCardPeeks: true,
        fits: true,
        pageFits: true,
      });
      await page.screenshot({ path: `${output}/trip-guide-carousel-${width}-${theme}.png` });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("heading", { name: "Guides for your trip", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/trip-four-city-guides.png` });
  // Traveler-written guides stay out of the itinerary's curated guide slot.
  await page
    .getByRole("button", { name: "Browse all popular places in Bangkok" })
    .click();
  await page.getByText("By the Navio team").waitFor();
  assert.equal(
    await page
      .getByRole("heading", { name: "Bangkok from a local", exact: true })
      .count(),
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: country carousels support arrows, keyboard, pagination and desktop/mobile light/dark layouts; all four trip cities, Osaka and country-wide Japan guides remain discoverable; itinerary remains Navio team content",
  );
} finally {
  await browser.close();
}
