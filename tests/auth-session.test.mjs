// Run: node --test tests/auth-session.test.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";
import { createTokenRefreshCoordinator } from "../lib/token-refresh-coordinator.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    if (specifier === "next/headers") {
      return {
        url: "data:text/javascript,export async function headers() { return new Headers(globalThis.__navioTestHeaders); } export async function cookies() { throw new Error('Read-only test context'); }",
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    if (specifier === "./with-authenticated-session") {
      return nextResolve(`${specifier}.ts`, context);
    }
    if (["next/server", "next/headers", "next/navigation"].includes(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    return nextResolve(specifier, context);
  },
});

process.env.AUTH_SECRET = "local-test-secret-not-for-production";
process.env.AUTH_URL = "http://localhost:3000";
process.env.AUTH_TRUST_HOST = "true";
process.env.AUTH_KEYCLOAK_ISSUER = "http://keycloak.test/realms/navio";
process.env.AUTH_KEYCLOAK_INTERNAL_ISSUER = process.env.AUTH_KEYCLOAK_ISSUER;
process.env.AUTH_KEYCLOAK_ID = "navio-web";
process.env.AUTH_KEYCLOAK_SECRET = "test-client-secret";

const { encode, decode } = await import("next-auth/jwt");
const { withAuthenticatedSession } = await import("../app/api/_lib/with-authenticated-session.ts");
const { readAuth } = await import("../auth.ts");
const { NextRequest } = await import("next/server");
const { POST: directions } = await import("../app/api/routes/directions/route.ts");

// App Router wraps requests and binds public accessors to the original target.
// The proxy itself does not carry Node Request's private internal state.
function routeRequest(url, init) {
  return new Proxy(new NextRequest(url, init), {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.__navioTestHeaders;
  delete process.env.NAVIO_API_BASE_URL;
});

test("read-only page rendering does not consume a refresh token it cannot persist", async () => {
  const cookieName = "authjs.session-token";
  const cookie = await encode({
    secret: process.env.AUTH_SECRET, salt: cookieName,
    token: { sub: "page-user", accessToken: "expired", accessTokenExpiresAt: 1, refreshToken: "page-refresh" },
  });
  globalThis.__navioTestHeaders = { cookie: `${cookieName}=${cookie}` };
  let refreshes = 0;
  globalThis.fetch = async () => { refreshes++; throw new Error("must not refresh"); };
  assert.equal((await readAuth()).user.id, "page-user");
  assert.equal(refreshes, 0);
});

test("simultaneous and late requests share one refresh; expired entries are replaced", async () => {
  let now = 1000;
  let calls = 0;
  const coordinate = createTokenRefreshCoordinator(30_000, () => now);
  const refresh = async () => ++calls;
  assert.deepEqual(await Promise.all(Array.from({ length: 10 }, () => coordinate("one", refresh))), Array(10).fill(1));
  assert.equal(await coordinate("one", refresh), 1);
  assert.equal(await coordinate("another-user", refresh), 2);
  now += 30_001;
  assert.equal(await coordinate("one", refresh), 3);
});

test("a rejected refresh does not poison subsequent attempts", async () => {
  const coordinate = createTokenRefreshCoordinator();
  await assert.rejects(coordinate("retry", async () => { throw new Error("offline"); }));
  assert.equal(await coordinate("retry", async () => "recovered"), "recovered");
});

test("API requests persist rotated cookies and reuse them after concurrent expiry", async () => {
  const cookieName = "authjs.session-token";
  const secret = process.env.AUTH_SECRET;
  const expiredCookie = await encode({
    secret, salt: cookieName,
    token: { sub: "test-user", accessToken: "expired", accessTokenExpiresAt: 1, refreshToken: "single-use-refresh" },
  });
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "http://keycloak.test/realms/navio/protocol/openid-connect/token");
    assert.equal(options.body.get("refresh_token"), "single-use-refresh");
    refreshes++;
    return refreshes === 1
      ? Response.json({ access_token: "fresh-access", expires_in: 300, refresh_token: "rotated-refresh" })
      : Response.json({ error: "invalid_grant" }, { status: 400 });
  };
  const call = (cookie) => withAuthenticatedSession(
    routeRequest("http://localhost:3000/api/groups/mine", { headers: { cookie } }),
    async (_request, session) => Response.json({ accessToken: session?.accessToken, error: session?.error }),
  );
  const responses = await Promise.all(Array.from({ length: 8 }, () => call(`${cookieName}=${expiredCookie}`)));
  assert.equal(refreshes, 1);
  for (const response of responses) {
    assert.deepEqual(await response.json(), { accessToken: "fresh-access" });
    const cookie = response.headers.getSetCookie().find((value) => value.startsWith(`${cookieName}=`));
    assert.ok(cookie, "the response must write the rotated browser cookie");
    const value = cookie.split(";")[0].slice(cookieName.length + 1);
    const token = await decode({ token: value, secret, salt: cookieName });
    assert.equal(token.refreshToken, "rotated-refresh");
    assert.deepEqual(await (await call(cookie.split(";")[0])).json(), { accessToken: "fresh-access" });
  }
  assert.equal(refreshes, 1);
});

test("anonymous sessions remain anonymous", async () => {
  const response = await withAuthenticatedSession(
    new Request("http://localhost:3000/api/groups/mine"),
    async (_request, session) => Response.json({ signedIn: Boolean(session) }),
  );
  assert.deepEqual(await response.json(), { signedIn: false });
});

test("proxied route requests preserve URL, headers, body bytes, and cancellation", async () => {
  const bytes = new Uint8Array([0, 255, 128, 65, 13, 10]);
  for (const method of ["GET", "HEAD", "POST", "PATCH", "DELETE"]) {
    const hasBody = method !== "GET" && method !== "HEAD";
    const controller = new AbortController();
    const url = "http://localhost:3000/api/posts?page=2";
    const response = await withAuthenticatedSession(
      routeRequest(url, {
        method,
        headers: { "content-type": "application/octet-stream", "x-request-id": "proxy-test" },
        body: hasBody ? bytes : undefined,
        signal: controller.signal,
      }),
      async (request, session) => {
        assert.equal(session, null);
        assert.equal(request.url, url);
        assert.equal(request.method, method);
        assert.equal(request.headers.get("content-type"), "application/octet-stream");
        assert.equal(request.headers.get("x-request-id"), "proxy-test");
        assert.deepEqual(new Uint8Array(await request.arrayBuffer()), hasBody ? bytes : new Uint8Array());
        controller.abort();
        assert.equal(request.signal.aborted, true);
        return new Response(null, { status: 204 });
      },
    );
    assert.equal(response.status, 204);
  }
});

test("directions forwards its JSON after authentication without consuming the body twice", async () => {
  const cookieName = "authjs.session-token";
  const cookie = await encode({
    secret: process.env.AUTH_SECRET, salt: cookieName,
    token: { sub: "route-user", accessToken: "route-access", accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 300 },
  });
  const body = JSON.stringify({ profile: "driving", groups: [{ id: "day-1", points: [] }] });
  const result = { segments: [] };
  process.env.NAVIO_API_BASE_URL = "http://gateway.test";
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(String(url), "http://gateway.test/v1/routes/directions");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.get("authorization"), "Bearer route-access");
    assert.equal(options.headers.get("content-type"), "application/json");
    assert.equal(options.body, body);
    return Response.json(result);
  };
  const request = (authenticated) => routeRequest("http://localhost:3000/api/routes/directions", {
    method: "POST", body,
    headers: { "content-type": "application/json", ...(authenticated ? { cookie: `${cookieName}=${cookie}` } : {}) },
  });
  assert.equal((await directions(request(false))).status, 401);
  assert.equal(calls, 0);
  const response = await directions(request(true));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), result);
  assert.equal(calls, 1);
});
