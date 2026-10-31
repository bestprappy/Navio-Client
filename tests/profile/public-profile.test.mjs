import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));

const { leavesPage } = await import("../../lib/unsaved-changes.ts");
const { BANNER_ASPECT, clampCrop, cropSourceRect, imagePlacement, INITIAL_CROP } = await import("../../lib/avatar-crop.ts");
const { publicProfileFormSchema, userProfileSchema } = await import("../../lib/validations/profile.ts");
const { resolveInterests, paceLabel } = await import("../../lib/travel-interests.ts");
const { describeFailure } = await import("../../lib/api-client.ts");

const here = { href: "https://navio.test/settings/profile" };

test("unsaved changes are guarded only for links that leave the page", () => {
  assert.equal(leavesPage({ href: "/settings/account" }, here), true);
  assert.equal(leavesPage({ href: "https://example.com" }, here), true);
  assert.equal(leavesPage({ href: "#bio" }, here), false, "a fragment on the same page keeps the form");
  assert.equal(leavesPage({ href: "/settings/profile" }, here), false);
  assert.equal(leavesPage({ href: "/u/alex", target: "_blank" }, here), false, "a new tab keeps this page");
  assert.equal(leavesPage({ href: "/file.jpg", download: true }, here), false);
});

test("an unzoomed banner crop is the centred 3:1 strip of a phone photo", () => {
  const photo = { width: 4032, height: 3024 };
  const rect = cropSourceRect(photo, INITIAL_CROP, BANNER_ASPECT);
  assert.equal(Math.round(rect.width), 4032);
  assert.equal(Math.round(rect.height), 1344);
  assert.equal(Math.round(rect.y), 840);
  assert.equal(Math.round(rect.x), 0);
});

test("a banner can move vertically but never uncover its frame", () => {
  const photo = { width: 4032, height: 3024 };
  const crop = clampCrop(photo, { zoom: 1, offsetX: 3, offsetY: -3 }, BANNER_ASPECT);
  assert.equal(crop.offsetX, 0, "a full-width image cannot move sideways");
  const rect = cropSourceRect(photo, crop, BANNER_ASPECT);
  assert.ok(rect.y >= -1e-9 && rect.y + rect.height <= photo.height + 1e-9);
  const placement = imagePlacement(photo, crop, BANNER_ASPECT);
  assert.ok(placement.top <= 1e-9 && placement.top + placement.height >= 1 - 1e-9);
});

test("square crops are unchanged by the aspect support", () => {
  const rect = cropSourceRect({ width: 4032, height: 3024 }, INITIAL_CROP);
  assert.equal(Math.round(rect.size), 3024);
  assert.equal(rect.width, rect.height);
});

test("usernames are normalised and validated like the profile service does", () => {
  const base = { displayName: "Alex", bio: "", travelInterests: [], travelPace: "" };
  assert.equal(publicProfileFormSchema.parse({ ...base, username: " @Alex_Road " }).username, "alex_road");
  for (const bad of ["ab", "9lives", "has space", "dash-ed", "x".repeat(31)]) {
    assert.equal(publicProfileFormSchema.safeParse({ ...base, username: bad }).success, false, bad);
  }
  assert.equal(publicProfileFormSchema.safeParse({ ...base, username: "alex", bio: "x".repeat(281) }).success, false);
  assert.equal(publicProfileFormSchema.safeParse({ ...base, username: "alex", travelInterests: Array(9).fill("food") }).success, false);
});

test("profiles from an older service still parse with safe defaults", () => {
  const profile = userProfileSchema.parse({ id: "1", displayName: "Alex", email: "a@example.com" });
  assert.equal(profile.username, null);
  assert.equal(profile.bio, "");
  assert.deepEqual(profile.travelInterests, []);
  assert.equal(profile.showTravelPreferences, true);
});

test("unknown travel interests are skipped and paces are labelled", () => {
  assert.deepEqual(resolveInterests(["food", "<script>", "ev_travel"]).map((interest) => interest.label), ["Food", "EV travel"]);
  assert.equal(paceLabel("relaxed"), "Relaxed");
  assert.equal(paceLabel("warp"), null);
});

test("failures show the service's own message for client errors but never for server errors", () => {
  assert.equal(describeFailure(409, { message: "This username is taken" }), "This username is taken");
  assert.equal(describeFailure(500, { message: "SQL detail" }), "The Navio service is unavailable right now. Try again shortly.");
  assert.equal(describeFailure(401, null), "Your session has expired. Sign in again to continue.");
});
