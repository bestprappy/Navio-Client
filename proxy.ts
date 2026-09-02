import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getSignInHref } from "@/lib/auth-navigation";

export const proxy = auth((request) => {
  if (request.auth?.user && !request.auth.error) {
    return NextResponse.next();
  }

  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(
    new URL(getSignInHref(callbackUrl), request.nextUrl.origin),
  );
});

export const config = {
  matcher: ["/planner/:path*", "/community/create"],
};
