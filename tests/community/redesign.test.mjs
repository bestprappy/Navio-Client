// Run: node --experimental-transform-types --test tests/community/redesign.test.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";
import { groupFixture, pageFixture, postFixture } from "./data.ts";

// Community modules import siblings without extensions, as the Next bundler allows.
registerHooks({ resolve(specifier, context, next) {
  if (/^\.\/community-[a-z-]+$/.test(specifier)) return next(`${specifier}.ts`, context);
  return next(specifier, context);
} });
const { communityPictureUrl, communitySlugPreview, createGroupSchema, groupDetailSchema, listGroups, toCommunityGroup } =
  await import("../../app/feature/community/_components/community-api.ts");
const { commentSchema, listPosts, postSchema } = await import("../../app/feature/community/_components/community-post-api.ts");
const { toggleReaction } = await import("../../app/feature/community/_components/community-reaction-state.ts");

const ICON = "44444444-4444-4444-8444-444444444444";
const BANNER = "55555555-5555-4555-8555-555555555555";
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const comment = {
  id: "66666666-6666-4666-8666-666666666666", postId: postFixture.id, authorId: groupFixture.createdById,
  parentCommentId: null, body: "Try the night market", deleted: false, edited: false,
  createdAt: "2026-09-12T00:00:00Z", upvotes: 0, viewerVote: 0,
};

test("uploaded icons and banners become cache-busted same-origin picture URLs", () => {
  const group = toCommunityGroup(groupDetailSchema.parse({ ...groupFixture, iconMediaId: ICON, bannerMediaId: BANNER }));
  assert.equal(group.avatarUrl, `/api/groups/road-trip-planners-2/icon?v=${ICON}`);
  assert.equal(group.bannerUrl, `/api/groups/road-trip-planners-2/banner?v=${BANNER}`);
  assert.equal(group.profile.bannerUrl, group.bannerUrl);
});

test("communities without pictures fall back to generated artwork instead of broken URLs", () => {
  const group = toCommunityGroup(groupDetailSchema.parse(groupFixture));
  assert.equal(group.avatarUrl, "");
  assert.equal(group.bannerUrl, "");
  assert.equal(communityPictureUrl("trips", "icon", null), "");
});

test("list items from a service without picture fields still parse", async () => {
  globalThis.fetch = async () => Response.json(pageFixture);
  const page = await listGroups("", 0);
  assert.equal(page.content[0].iconMediaId, null);
  globalThis.fetch = async () => Response.json({ ...pageFixture, content: [{ ...groupFixture, iconMediaId: ICON }] });
  assert.equal(toCommunityGroup((await listGroups("", 0)).content[0]).avatarUrl, `/api/groups/road-trip-planners-2/icon?v=${ICON}`);
});

test("feed posts carry their community icon for the meta row", () => {
  assert.equal(postSchema.parse({ ...postFixture, groupIconMediaId: ICON }).groupIconUrl, `/api/groups/road-trip-planners-2/icon?v=${ICON}`);
  assert.equal(postSchema.parse(postFixture).groupIconUrl, "");
});

test("the home feed asks the server for joined communities only, and a community feed never does", async () => {
  const urls = [];
  globalThis.fetch = async (url) => { urls.push(new URL(url, "http://localhost")); return Response.json({ ...pageFixture, content: [] }); };
  await listPosts("", "best", 0, undefined, undefined, true);
  await listPosts("", "best", 0, "trips", undefined, true);
  await listPosts("", "top", 0);
  assert.equal(urls[0].searchParams.get("joined"), "true");
  assert.equal(urls[1].searchParams.get("joined"), null);
  assert.equal(urls[1].searchParams.get("group"), "trips");
  assert.equal(urls[2].searchParams.get("joined"), null);
});

test("comment reactions parse, and an unknown future reaction is dropped instead of failing the thread", () => {
  const parsed = commentSchema.parse({ ...comment, reactions: [
    { reaction: "want_to_go", count: 2, reacted: true }, { reaction: "angry", count: 1, reacted: false },
  ] });
  assert.deepEqual(parsed.reactions, [{ reaction: "want_to_go", count: 2, reacted: true }]);
  assert.deepEqual(commentSchema.parse(comment).reactions, []);
});

test("reacting adds the viewer once, in display order, and never double counts", () => {
  const start = [{ reaction: "thanks", count: 1, reacted: false }];
  const helpful = toggleReaction(start, "helpful", true);
  assert.deepEqual(helpful.map((item) => item.reaction), ["helpful", "thanks"]);
  const thanks = toggleReaction(helpful, "thanks", true);
  assert.deepEqual(thanks[1], { reaction: "thanks", count: 2, reacted: true });
  assert.equal(toggleReaction(thanks, "thanks", true), thanks);
});

test("removing a reaction decrements it, and the last one disappears", () => {
  const reactions = [{ reaction: "love", count: 1, reacted: true }, { reaction: "funny", count: 3, reacted: true }];
  assert.deepEqual(toggleReaction(reactions, "love", false), [{ reaction: "funny", count: 3, reacted: true }]);
  assert.deepEqual(toggleReaction(reactions, "funny", false)[1], { reaction: "funny", count: 2, reacted: false });
  const others = [{ reaction: "love", count: 4, reacted: false }];
  assert.equal(toggleReaction(others, "love", false), others);
});

test("the address preview matches the service's slug rules", () => {
  assert.equal(communitySlugPreview("  Thailand Road-Trips & EVs! "), "thailand-road-trips-evs");
  assert.equal(communitySlugPreview("กรุงเทพ"), "");
  assert.equal(createGroupSchema.safeParse({ name: "Trips", description: "x".repeat(501), country: "", places: "", tags: "" }).success, false);
});
