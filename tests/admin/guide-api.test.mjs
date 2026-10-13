import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { createStore } from "jotai";

registerHooks({ resolve(specifier, context, next) {
  return next(!context.parentURL?.includes("/node_modules/") && specifier.startsWith(".") && !/\.(ts|tsx|js|mjs|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const root = "../../app/feature/admin/_components/guides/";
const api = await import(`${root}guides-api.ts`);
const atoms = await import(`${root}guides.atoms.ts`);
const { createGuide } = await import(`${root}guide-model.ts`);
const routes = await import("../../app/api/admin/guides/guide-routes.ts");
const id = "8f2b6c1e-5d3a-4c7b-9e1f-2a6d4b8c0e01";
const guide = createGuide({ id, country: "Thailand", now: new Date().toISOString(), destination: { provider: "GOOGLE", providerPlaceId: "ChIJ-city", name: "City", lat: 0, lng: 0 } });

test("guide listing fetches every page so guides after the first hundred are visible", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(url);
    const page = new URL(url, "http://localhost").searchParams.get("page");
    return Response.json({ content: [{ id: `${id}-${page}`, name: `City ${page}`, country: "Thailand", countryCode: "TH", coverPlaceId: "GOOGLE:city", destinationProvider: "GOOGLE", destinationPlaceId: `city-${page}`, status: "DRAFT", version: 0, placeCount: 0, categories: [], updatedAt: guide.updatedAt, updatedByName: null, publishedAt: null }], totalElements: 2, totalPages: 2, number: Number(page) });
  });
  assert.equal((await api.listGuides()).length, 2);
  assert.deepEqual(calls, ["/api/admin/guides?size=100&page=0", "/api/admin/guides?size=100&page=1"]);
});

test("a save rejected by another admin's version is exposed as a conflict", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ message: "Changed by another admin" }, { status: 409 }));
  await assert.rejects(() => api.saveGuide(guide), (error) => error instanceof api.GuideApiError && error.kind === "conflict");
});

test("accepting a save retains edits typed during the request and uses the new version", () => {
  const store = createStore();
  store.set(atoms.loadGuideDraftAtom, guide);
  store.set(atoms.updateGuideAtom, { guideId: id, update: (current) => ({ ...current, name: "Typed while saving" }) });
  store.set(atoms.acceptSavedGuideAtom, { ...guide, version: 2 });
  assert.equal(store.get(atoms.guideDraftsAtom)[id].name, "Typed while saving");
  assert.equal(store.get(atoms.guideDraftsAtom)[id].version, 2);
});

test("guide proxies permit only the specified CRUD and publication paths", () => {
  assert.ok(routes.isAllowedGuideRoute("GET", []));
  assert.ok(routes.isAllowedGuideRoute("PUT", [id]));
  assert.ok(routes.isAllowedGuideRoute("POST", [id, "publish"]));
  assert.ok(routes.isAllowedPublicGuideRoute("GET", [id]));
  assert.equal(routes.isAllowedPublicGuideRoute("POST", [id]), false);
  assert.equal(routes.isAllowedGuideRoute("GET", [id, "draft"]), false);
  assert.equal(routes.isAllowedGuideRoute("GET", ["../users"]), false);
});
