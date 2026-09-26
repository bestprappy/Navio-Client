// Run: node --experimental-transform-types --test tests/admin/admin.test.mjs
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  AdminApiError,
  describeAdminFailure,
  fetchAdminStatistics,
  fetchModerationEvents,
  moderateUser,
  moderationReasonSchema,
  searchAdminUsers,
} from "../../app/feature/admin/_components/admin-api.ts";
import { adminUsersHref, readAdminUsersView } from "../../app/feature/admin/_components/admin-users-url.ts";
import { isAllowedAdminUsersRoute } from "../../app/api/admin/users/admin-users-routes.ts";
import { canUseAdminConsole, isAdministrator, readNavioRoles } from "../../lib/navio-roles.ts";
import { statisticsFixture, TARGET_ID, userPageFixture } from "./data.ts";

const originalFetch = globalThis.fetch;
const originalError = console.error;
afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalError;
});

function respondWith(status, body) {
  const calls = [];
  console.error = () => {};
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
  return calls;
}

test("reads only Navio roles from the realm claim, ignoring Keycloak's own", () => {
  const roles = readNavioRoles({
    realm_access: { roles: ["offline_access", "default-roles-navio", "moderator", "USER", 7] },
    resource_access: { "navio-web": { roles: ["ADMIN"] } },
  });
  assert.deepEqual(roles, ["USER", "MODERATOR"]);
  assert.deepEqual(readNavioRoles(undefined), []);
  assert.deepEqual(readNavioRoles({ realm_access: { roles: "ADMIN" } }), []);
});

test("only moderators and administrators see the admin console", () => {
  assert.equal(canUseAdminConsole(["USER"]), false);
  assert.equal(canUseAdminConsole(undefined), false);
  assert.equal(canUseAdminConsole(["USER", "MODERATOR"]), true);
  assert.equal(isAdministrator(["USER", "MODERATOR"]), false);
  assert.equal(isAdministrator(["ADMIN"]), true);
});

test("the proxy forwards the console's routes and nothing else", () => {
  assert.equal(isAllowedAdminUsersRoute("GET", []), true);
  assert.equal(isAllowedAdminUsersRoute("GET", ["statistics"]), true);
  assert.equal(isAllowedAdminUsersRoute("GET", [TARGET_ID]), true);
  assert.equal(isAllowedAdminUsersRoute("GET", [TARGET_ID, "moderation-events"]), true);
  assert.equal(isAllowedAdminUsersRoute("POST", [TARGET_ID, "suspend"]), true);
  assert.equal(isAllowedAdminUsersRoute("POST", [TARGET_ID, "reactivate"]), true);

  // Role changes have no UI, so the browser cannot reach them.
  assert.equal(isAllowedAdminUsersRoute("POST", [TARGET_ID, "roles"]), false);
  assert.equal(isAllowedAdminUsersRoute("DELETE", [TARGET_ID, "roles", "ADMIN"]), false);
  assert.equal(isAllowedAdminUsersRoute("POST", ["statistics", "suspend"]), false);
  assert.equal(isAllowedAdminUsersRoute("GET", ["..", "..", "trips"]), false);
  assert.equal(isAllowedAdminUsersRoute("PATCH", [TARGET_ID]), false);
});

test("the users URL round-trips and rejects values it does not understand", () => {
  const view = readAdminUsersView(new URLSearchParams(`q=jane&status=suspended&page=3&user=${TARGET_ID}`));
  assert.deepEqual(view, { term: "jane", status: "suspended", page: 2, userId: TARGET_ID });
  assert.equal(adminUsersHref(view), `/admin/users?q=jane&status=suspended&page=3&user=${TARGET_ID}`);

  const junk = readAdminUsersView(new URLSearchParams("status=SUPERUSER&page=-4&user=not-a-uuid"));
  assert.deepEqual(junk, { term: "", status: null, page: 0, userId: null });
  assert.equal(adminUsersHref({}), "/admin/users");
});

test("search sends the backend's status name and the page size", async () => {
  const calls = respondWith(200, userPageFixture);
  const page = await searchAdminUsers({ term: "  jane ", status: "suspended", page: 1 });
  assert.equal(page.content[0].status, "suspended");
  const url = new URL(calls[0].url, "https://navio.test");
  assert.equal(url.pathname, "/api/admin/users");
  assert.equal(url.searchParams.get("term"), "jane");
  assert.equal(url.searchParams.get("status"), "SUSPENDED");
  assert.equal(url.searchParams.get("page"), "1");
  assert.equal(url.searchParams.get("size"), "20");
});

test("a failed count request is an error, never a zero", async () => {
  respondWith(503, { status: 503, message: "The identity provider is temporarily unavailable" });
  await assert.rejects(fetchAdminStatistics(), (error) =>
    error instanceof AdminApiError && error.status === 503 && /temporarily unavailable/i.test(error.message));

  respondWith(200, { ...statisticsFixture, totalUsers: "42" });
  await assert.rejects(fetchAdminStatistics(), (error) =>
    error instanceof AdminApiError && /cannot read/i.test(error.message));

  respondWith(200, statisticsFixture);
  assert.equal((await fetchAdminStatistics()).suspendedUsers, 3);
});

test("banning calls the suspend endpoint with the trimmed reason", async () => {
  const calls = respondWith(200, {
    userId: TARGET_ID, status: "suspended", reason: "Spam", expiresAt: null, updatedAt: "2026-09-24T10:00:00Z",
  });
  await moderateUser(TARGET_ID, "ban", "  Spam  ");
  assert.equal(calls[0].url, `/api/admin/users/${TARGET_ID}/suspend`);
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { reason: "Spam" });
});

test("failure messages explain what happened in the console's words", () => {
  assert.equal(
    describeAdminFailure(409, { message: "This account is already suspended" }),
    "This account is already banned. Refresh to see its current state.",
  );
  assert.equal(
    describeAdminFailure(403, { message: "Only an administrator can moderate a moderator or administrator account" }),
    "Only an administrator can moderate a moderator or administrator account",
  );
  assert.equal(
    describeAdminFailure(403, { message: "You do not have permission to perform this action" }),
    "Your account does not have access to this.",
  );
  assert.match(describeAdminFailure(401, null), /sign in again/i);
});

test("a ban needs a real reason", () => {
  assert.equal(moderationReasonSchema.safeParse("  ").success, false);
  assert.equal(moderationReasonSchema.safeParse("ok").success, false);
  assert.equal(moderationReasonSchema.safeParse("Spam reports confirmed").success, true);
  assert.equal(moderationReasonSchema.safeParse("x".repeat(2001)).success, false);
});

test("history requests the selected page without changing the account", async () => {
  const calls = respondWith(200, { content: [], number: 2, size: 20, totalElements: 41, totalPages: 3 });
  await fetchModerationEvents(TARGET_ID, 2);
  assert.equal(calls[0].url, `/api/admin/users/${TARGET_ID}/moderation-events?page=2&size=20`);
});

test("a lost moderation response never claims that nothing changed", async () => {
  console.error = () => {};
  globalThis.fetch = async () => { throw new DOMException("Timed out", "TimeoutError"); };
  await assert.rejects(moderateUser(TARGET_ID, "ban", "Spam"), (error) =>
    error instanceof AdminApiError && /did not confirm the change/.test(error.message));
  for (const status of [502, 503, 504]) {
    assert.match(describeAdminFailure(status, null, true), /check its current state/);
    assert.doesNotMatch(describeAdminFailure(status, null, true), /nothing was changed/);
  }
});

test("invalid URL pages cannot turn into partial or overflowing API integers", () => {
  for (const value of ["3oops", "2.5", "Infinity", "9007199254740993", "2147483648"]) {
    assert.equal(readAdminUsersView(new URLSearchParams({ page: value })).page, 0);
  }
});
