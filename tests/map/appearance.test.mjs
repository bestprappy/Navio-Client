import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });

const { createStore } = await import("jotai");
const { mapAppearanceAtom } = await import("../../components/map/map-appearance.atoms.ts");
const { normalizeMapAppearance, resolveMapStyle, getGoogleMapStyles, mapPalettes } = await import("../../components/map/map-appearance.ts");
const { applyMapboxPalette } = await import("../../components/map/mapbox-appearance.ts");

test("stale device preferences fall back safely and map modes remain independent of app mode", () => {
  for (const value of [null, "dark", 7, [], { style: "removed-style", view: "4d" }]) {
    assert.deepEqual(normalizeMapAppearance(value), { style: "system" });
  }
  assert.deepEqual(normalizeMapAppearance({ style: "retro", view: "3d", ignored: true }), { style: "retro" });
  assert.deepEqual(normalizeMapAppearance({ style: "dark", view: "3d" }), { style: "dark" });
  assert.equal(resolveMapStyle("system", true), "dark");
  assert.equal(resolveMapStyle("system", false), "light");
  assert.equal(resolveMapStyle("light", true), "light");
  assert.equal(resolveMapStyle("retro", true), "retro");
});

test("appearance changes are shared by map consumers without changing trip data", () => {
  const store = createStore();
  store.set(mapAppearanceAtom, { style: "dark", view: "3d" });
  assert.deepEqual(store.get(mapAppearanceAtom), { style: "dark" });
  store.set(mapAppearanceAtom, { style: "retro" });
  assert.deepEqual(store.get(mapAppearanceAtom), { style: "retro" });
});

test("Google Light restores the original basemap and other themes style actual raster tiles", () => {
  assert.deepEqual(getGoogleMapStyles("light"), [], "Light must not tint Google's original colors");
  for (const style of ["dark", "minimal", "grayscale", "muted", "retro", "navio"]) {
    const styles = getGoogleMapStyles(style);
    assert.equal(styles.find((rule) => rule.featureType === "water").stylers[0].color, mapPalettes[style].water);
  }
});

test("Mapbox theme changes preserve route colors and restore only POIs hidden by the minimal style", () => {
  const layers = [
    { id: "water", type: "fill" }, { id: "road-street", type: "line" },
    { id: "poi-label", type: "symbol" }, { id: "transit-label", type: "symbol" },
    { id: "trip-route-solid", type: "line" }, { id: "navio-3d-buildings", type: "fill-extrusion" },
  ];
  const paint = new Map();
  const visibility = new Map([["poi-label", "none"], ["transit-label", "visible"]]);
  const map = {
    getStyle: () => ({ layers }),
    setPaintProperty: (id, key, value) => paint.set(`${id}:${key}`, value),
    getLayoutProperty: (id) => visibility.get(id),
    setLayoutProperty: (id, _key, value) => visibility.set(id, value),
  };
  const originals = new Map();
  applyMapboxPalette(map, mapPalettes.minimal, "minimal", originals);
  assert.equal(visibility.get("transit-label"), "none");
  assert.equal(paint.get("water:fill-color"), mapPalettes.minimal.water);
  applyMapboxPalette(map, mapPalettes.dark, "dark", originals);
  assert.equal(visibility.get("poi-label"), "none", "planner's POIs stay hidden");
  assert.equal(visibility.get("transit-label"), "visible", "theme's visibility change is reversed");
  assert.equal(paint.get("water:fill-color"), mapPalettes.dark.water);
  assert.equal(paint.get("trip-route-solid:line-color"), undefined);
  assert.equal(paint.get("navio-3d-buildings:fill-extrusion-color"), undefined);
  visibility.set("poi-label", "visible");
  applyMapboxPalette(map, mapPalettes.light, "light", new Map(), true);
  assert.equal(visibility.get("poi-label"), "none", "planner POI hiding survives any basemap load order");
});
