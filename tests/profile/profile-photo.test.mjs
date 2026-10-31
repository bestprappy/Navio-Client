import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));

const { clampCrop, cropSourceRect, imagePlacement, INITIAL_CROP, MAX_ZOOM } = await import("../../lib/avatar-crop.ts");
const { toMachineReadableLines } = await import("../../lib/profile-document.ts");

const landscapePhone = { width: 4032, height: 3024 };

test("an unzoomed landscape photo crops the centred full-height square", () => {
  const rect = cropSourceRect(landscapePhone, INITIAL_CROP);
  assert.equal(Math.round(rect.size), 3024);
  assert.equal(Math.round(rect.x), 504);
  assert.equal(Math.round(rect.y), 0);
});

test("zooming in halves the cropped square around the same centre", () => {
  const rect = cropSourceRect(landscapePhone, { zoom: 2, offsetX: 0, offsetY: 0 });
  assert.equal(Math.round(rect.size), 1512);
  assert.equal(Math.round(rect.x + rect.size / 2), 2016);
  assert.equal(Math.round(rect.y + rect.size / 2), 1512);
});

test("dragging never uncovers the viewport", () => {
  const crop = clampCrop(landscapePhone, { zoom: 1, offsetX: 5, offsetY: -5 });
  assert.ok(crop.offsetY === 0, "a landscape photo cannot move vertically at cover fit");
  const rect = cropSourceRect(landscapePhone, crop);
  assert.ok(rect.x >= -1e-9, "left edge stays inside the photo");
  assert.ok(rect.x + rect.size <= landscapePhone.width + 1e-9, "right edge stays inside the photo");
});

test("zoom is held between the cover fit and the maximum", () => {
  assert.equal(clampCrop(landscapePhone, { zoom: 0.2, offsetX: 0, offsetY: 0 }).zoom, 1);
  assert.equal(clampCrop(landscapePhone, { zoom: 99, offsetX: 0, offsetY: 0 }).zoom, MAX_ZOOM);
});

test("the on-screen placement and the cropped pixels describe the same square", () => {
  const crop = clampCrop({ width: 800, height: 1200 }, { zoom: 1.5, offsetX: 0.1, offsetY: -0.2 });
  const placed = imagePlacement({ width: 800, height: 1200 }, crop);
  const rect = cropSourceRect({ width: 800, height: 1200 }, crop);
  // The viewport's left edge sits -placed.left viewport units into the drawn image.
  assert.ok(Math.abs((-placed.left / placed.width) * 800 - rect.x) < 1e-6);
  assert.ok(Math.abs((-placed.top / placed.height) * 1200 - rect.y) < 1e-6);
});

test("the machine-readable strip spells the name in Latin capitals at passport width", () => {
  const [first, second] = toMachineReadableLines({
    displayName: "Zoë  Ng-Wong",
    userId: "3f2a9c1e-0000-4000-8000-000000000000",
    memberSince: "2026-08-12T09:00:00Z",
  });
  assert.equal(first.length, 44);
  assert.equal(second.length, 44);
  assert.ok(first.startsWith("P<NAVZOE<NG<WONG<"));
  assert.ok(second.startsWith("3F2A9C1E0<NAV260812"));
});

test("a name with no Latin letters still produces a full strip", () => {
  const [first] = toMachineReadableLines({ displayName: "ประพังกร", userId: "abc", memberSince: null });
  assert.ok(first.startsWith("P<NAVTRAVELLER<"));
  assert.equal(first.length, 44);
});
