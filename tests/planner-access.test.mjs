import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { getSignInHref } from "../lib/auth-navigation.ts";
import { isPublicPlannerRequest } from "../app/api/_lib/public-planner-request.ts";
import * as visitorId from "../lib/visitor-id.ts";

const require = createRequire(import.meta.url);
// Next normally supplies this global when booting its server; standalone tests do not.
globalThis.AsyncLocalStorage ??= AsyncLocalStorage;
const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server.js");
const tripId = "11111111-1111-4111-8111-111111111111";

function moduleFrom(file, dependencies) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, crypto, require: name => dependencies[name] ?? require(name) });
  return exports;
}

const routeProxy = moduleFrom("../proxy.ts", {
  "@/auth": { auth: handler => handler },
  "@/lib/auth-navigation": { getSignInHref },
  "@/lib/visitor-id": visitorId,
  "next/server": { NextResponse: { next: () => ({ allowed: true, cookies: cookieJar() }), redirect: url => ({ location: url.href }) } },
});

function cookieJar(initial = {}) {
  const values = { ...initial }, written = [];
  return {
    values, written,
    get: name => (name in values ? { value: values[name] } : undefined),
    set(option, value) {
      const cookie = typeof option === "string" ? { name: option, value } : option;
      values[cookie.name] = cookie.value;
      written.push(cookie);
    },
  };
}

function sharedPlanRequest(pathname, cookies = {}) {
  return { nextUrl: { pathname, protocol: "https:" }, headers: new Headers(), cookies: cookieJar(cookies) };
}

test("planner and dashboard URLs require authentication while public browsing stays accessible", () => {
  for (const url of ["/planner", "/planner/new", `/planner/${tripId}?from=2026-10-13`, "/planner/guest-old", "/dashboard", "/dashboard/settings"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config: routeProxy.config, nextConfig: {}, url }), true, url);
  }
  for (const url of ["/", "/explore", "/community", "/sign-in", "/sign-up", "/api/auth/session"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config: routeProxy.config, nextConfig: {}, url }), false, url);
  }
});

test("shared plans stay public and give a new browser one lasting visitor id", () => {
  for (const url of ["/explore/shared/public-token", "/share/plans/public-token"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config: routeProxy.config, nextConfig: {}, url }), true, url);
    const request = sharedPlanRequest(url);
    const response = routeProxy.proxy(request);
    assert.equal(response.allowed, true);
    assert.equal(response.location, undefined);
    const [cookie] = response.cookies.written;
    assert.equal(cookie.name, visitorId.VISITOR_COOKIE);
    assert.ok(visitorId.isVisitorId(cookie.value));
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.maxAge, visitorId.VISITOR_COOKIE_MAX_AGE_SECONDS);
    // The first render reads the same id, so the first view is counted too.
    assert.equal(request.cookies.values[visitorId.VISITOR_COOKIE], cookie.value);
  }
});

test("a returning browser keeps its visitor id so its view is not counted again", () => {
  const existing = "00000000-0000-4000-8000-0000000000a1";
  const response = routeProxy.proxy(sharedPlanRequest("/explore/shared/public-token", { [visitorId.VISITOR_COOKIE]: existing }));
  assert.equal(response.allowed, true);
  assert.equal(response.cookies.written.length, 0);
  assert.equal(visitorId.isVisitorId("not-a-uuid"), false);
});

test("anonymous and expired sessions redirect with the original planner URL", () => {
  const pathname = `/planner/${tripId}`, search = "?templatePlanId=101&from=2026-10-13";
  for (const auth of [null, {}, { user: { id: "user" }, error: "RefreshAccessTokenError" }]) {
    const result = routeProxy.proxy({ auth, nextUrl: { pathname, search, origin: "http://localhost:3000" } });
    const location = new URL(result.location);
    assert.equal(location.pathname, "/sign-in");
    assert.equal(location.searchParams.get("callbackUrl"), pathname + search);
  }
  assert.equal(routeProxy.proxy({ auth: { user: { id: "user" } }, nextUrl: { pathname: "/planner" } }).allowed, true);
});

function boundary(authenticated, loading = false, planId = tripId, userId = "user") {
  const { PlannerSessionBoundary } = moduleFrom("../app/feature/planner/_components/planner-session-boundary.tsx", {
    jotai: { Provider: "PlannerStore" },
    "next/navigation": { useParams: () => ({ planId }), redirect: path => { throw new Error(`redirect:${path}`); } },
    "next-auth/react": { useSession: () => ({ data: { user: { id: userId } } }) },
    "@/hooks/use-require-auth": { useRequireAuth: () => ({ isAuthenticated: authenticated, isAuthenticationLoading: loading, requireAuth() {} }) },
    "./planner-api": { isPersistedTripId: value => value === tripId },
    "@/components/ui/button": { Button: "Button" },
  });
  return PlannerSessionBoundary({ children: "private planner" });
}

test("session loss unmounts the planner and account changes reset its store", () => {
  assert.equal(boundary(true).props.children, "private planner");
  assert.notEqual(boundary(true, false, tripId, "first").key, boundary(true, false, tripId, "second").key);
  assert.equal(boundary(false).type, "section");
  assert.equal(boundary(false, true).props.role, "status");
  assert.throws(() => boundary(true, false, "guest-old"), /redirect:\/planner\/new/);
});

test("trip creation requires sign-in during both form submission and mutation", () => {
  let authenticated = false, mutation, submitted = null;
  const { PlannerSetup } = moduleFrom("../app/feature/planner/planner-setup.tsx", {
    "next/navigation": { useRouter: () => ({ push() {} }) },
    jotai: { useAtomValue: () => ({ id: "destination" }), useSetAtom: () => () => {} },
    "@tanstack/react-query": {
      useQueryClient: () => ({ invalidateQueries() {} }),
      useMutation: options => { mutation = options; return { mutate: payload => { submitted = payload; } }; },
    },
    "@/hooks/use-require-auth": { useRequireAuth: () => ({ isAuthenticated: authenticated, requireAuth: () => authenticated }) },
    "./_components/planner-api": { createTrip: payload => payload },
    "./_components/planner-setup.actions": { PlannerSetupActions: "Actions" },
    "./_components/planner-setup.atoms": {},
    "./_components/planner-setup.field-group": { PlannerSetupFieldGroup: "FieldGroup" },
    "./_components/planner-setup.header": { PlannerSetupHeader: "Header" },
  });
  PlannerSetup({ children: null }).props.onSubmit({ preventDefault() {} });
  assert.equal(submitted, null);
  assert.throws(() => mutation.mutationFn({ destinationId: "destination" }), /Sign in to create/);
  authenticated = true;
  PlannerSetup({ children: null }).props.onSubmit({ preventDefault() {} });
  assert.equal(submitted.destinationId, "destination");
  assert.equal(Object.keys(submitted).length, 3);
});

test("signed-out garage mutations reject every command before changing trip or account state", async () => {
  let mutation;
  const { GarageProvider } = moduleFrom("../app/feature/planner/planId/_components/garage/garage-provider.tsx", {
    react: { createContext: () => ({ Provider: "GarageContext" }), useRef: () => ({ current: 0 }), useMemo: fn => fn(), useLayoutEffect() {}, useEffect() {} },
    "next-auth/react": { useSession: () => ({ data: null, status: "unauthenticated" }) },
    jotai: { useStore: () => ({ get() { throw new Error("Private state must not be read"); } }), useAtom: () => [undefined] },
    "@tanstack/react-query": {
      useQueryClient: () => ({}), useQuery: () => ({}),
      useMutation: options => { mutation = options; return {}; },
    },
    "./trip-vehicle-library": {tripVehicles:()=>[],patchTripVehicle(){throw new Error("Private state must not be patched");}},
    "./trip-energy-state": { tripGarageIds: () => [] }, "./garage.atoms": {}, "./vehicle-mappers": {},
    "./vehicle-api": { executeVehicleCommand() { throw new Error("Account API must not be called"); } },
  });
  GarageProvider({ children: null });
  for (const command of [{ kind: "catalog" }, { kind: "custom" }, { kind: "reuse" }, { kind: "update" }, { kind: "delete" }]) {
    await assert.rejects(mutation.mutationFn(command), /Sign in to update your garage/);
  }
});

test("public data allowlist excludes account data, saved trips, and mutations", () => {
  assert.equal(isPublicPlannerRequest("GET", "/v1/geo/places/search?q=Bangkok"), true);
  assert.equal(isPublicPlannerRequest("POST", "/v1/routes/directions"), true);
  for (const path of ["/v1/trips", "/v1/trips/id/planner", "/v1/users/me/vehicles", "/v1/posts/id/vote", "/internal/v1/ev-route"]) {
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) assert.equal(isPublicPlannerRequest(method, path), false);
  }
  assert.equal(isPublicPlannerRequest("POST", "/v1/trips/currencies/rate"), false);
});
