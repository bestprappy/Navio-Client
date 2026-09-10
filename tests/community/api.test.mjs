// Run: node --experimental-transform-types --test tests/community/api.test.mjs
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  CommunityApiError,
  communityRequest,
  createGroupSchema,
  groupDetailSchema,
  listGroups,
  membershipSchema,
  splitCommunityTerms,
  toCommunityGroup,
} from "../../app/feature/community/_components/community-api.ts";
import { groupFixture, pageFixture } from "./data.ts";

const originalFetch = globalThis.fetch;
const originalError = console.error;
afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalError;
});

test("parses real group details without synthesizing activity, avatars, or content", () => {
  const group = toCommunityGroup(groupDetailSchema.parse(groupFixture));
  assert.equal(group.slug, "road-trip-planners-2");
  assert.equal(group.country, "");
  assert.equal(group.profile.summary, groupFixture.description);
  assert.equal(group.profile.weeklyVisitorCount, 0);
  assert.deepEqual(group.rules, []);
  assert.equal(group.avatarUrl, "");
});

test("search and pagination preserve encoded search terms and the next page", async () => {
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url, "http://localhost");
    assert.equal(parsed.pathname, "/api/groups/search");
    assert.equal(parsed.searchParams.get("q"), "EV & cafés");
    assert.equal(parsed.searchParams.get("page"), "2");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    return Response.json({ ...pageFixture, number: 2 });
  };
  assert.equal((await listGroups(" EV & cafés ", 2)).number, 2);
});

test("mine uses the authenticated membership listing", async () => {
  globalThis.fetch = async (url) => {
    assert.match(url, /^\/api\/groups\/mine\?/);
    return Response.json(pageFixture);
  };
  assert.equal((await listGroups("", 0, undefined, true)).content.length, 1);
});

test("rejects malformed successful responses instead of returning mock groups", async () => {
  console.error = () => {};
  globalThis.fetch = async () => Response.json({ content: [{}] });
  await assert.rejects(
    listGroups("", 0),
    (error) => error instanceof CommunityApiError && error.status === 502,
  );
});

test("preserves a last-moderator conflict without pretending the membership changed", async () => {
  console.error = () => {};
  globalThis.fetch = async () =>
    Response.json(
      {
        message:
          "Hand over moderation before leaving: you are the last moderator",
      },
      { status: 409 },
    );
  await assert.rejects(
    communityRequest("/road-trip-planners-2/members/me", membershipSchema, {
      method: "DELETE",
    }),
    /last moderator/,
  );
});

test("handles expired sessions, non-JSON gateway failures, network failures and timeouts", async () => {
  console.error = () => {};
  globalThis.fetch = async () => Response.json({}, { status: 401 });
  await assert.rejects(listGroups("", 0), /sign in again/);
  globalThis.fetch = async () => new Response("Bad gateway", { status: 502 });
  await assert.rejects(listGroups("", 0), /temporarily unavailable/);
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(listGroups("", 0), /Check your connection/);
  globalThis.fetch = async () => {
    throw new DOMException("Timed out", "TimeoutError");
  };
  await assert.rejects(listGroups("", 0), /Check your connection/);
});

test("accepts empty pages and nullable optional fields", async () => {
  globalThis.fetch = async () =>
    Response.json({
      ...pageFixture,
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
  assert.deepEqual((await listGroups("", 0)).content, []);
  assert.equal(
    groupDetailSchema.parse({ ...groupFixture, places: null, tags: null })
      .country,
    null,
  );
});

test("validates required creation fields and normalizes comma-separated terms", () => {
  assert.equal(
    createGroupSchema.safeParse({
      name: "  ",
      description: "",
      country: "",
      places: "",
      tags: "",
    }).success,
    false,
  );
  assert.deepEqual(
    splitCommunityTerms(" Bangkok, EV, Bangkok, , Chiang Mai "),
    ["Bangkok", "EV", "Chiang Mai"],
  );
  for (const name of ["create", "Discovery!", "mine", "search", "popular"]) {
    assert.equal(
      createGroupSchema.safeParse({
        name,
        description: "Travel",
        country: "",
        places: "",
        tags: "",
      }).success,
      false,
    );
  }
});
