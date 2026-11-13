import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { getSignInHref } from "@/lib/auth-navigation";
import {
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE_SECONDS,
  isSharedPlanPath,
  isVisitorId,
} from "@/lib/visitor-id";

const requireSignIn = auth((request) => {
  if (request.auth?.user && !request.auth.error) {
    return NextResponse.next();
  }

  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(
    new URL(getSignInHref(callbackUrl), request.nextUrl.origin),
  );
});

/**
 * Gives a browser opening a shared plan its visitor id, so the plan's view is
 * counted once per browser. The id is also written onto this request, so the
 * very first render already carries it. Shared plans stay public: no sign-in.
 */
function withVisitorId(request: NextRequest) {
  if (isVisitorId(request.cookies.get(VISITOR_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const visitorId = crypto.randomUUID();
  request.cookies.set(VISITOR_COOKIE, visitorId);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set({
    name: VISITOR_COOKIE,
    value: visitorId,
    httpOnly: true,
    sameSite: "lax",
    secure:
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (isSharedPlanPath(request.nextUrl.pathname)) {
    return withVisitorId(request);
  }
  // Auth.js types its wrapper for route handlers. In a proxy the second argument
  // is the fetch event, which it only forwards to the callback above (unused).
  return requireSignIn(request, event as unknown as Parameters<typeof requireSignIn>[1]);
}

export const config = {
  matcher: ["/dashboard/:path*", "/planner/:path*", "/community/create", "/admin", "/admin/:path*", "/settings", "/settings/:path*", "/u/:path*", "/people/:path*", "/notifications", "/explore/shared/:path*", "/share/plans/:path*"],
};
