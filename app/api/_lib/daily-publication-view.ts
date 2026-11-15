import { NextResponse, type NextRequest } from "next/server";
import { dailyPublicationReadId } from "@/lib/daily-publication-read";
import { VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE_SECONDS, isVisitorId } from "@/lib/visitor-id";
import { proxyAuthenticatedApiRequest } from "./authenticated-api-proxy";

/** Reuse the backend's atomic receipt ledger; never skip authenticated replays,
 * since they may attach a first unique account to an already-counted view.
 */
export async function proxyDailyPublicationView(request: NextRequest, upstreamPath: string): Promise<Response> {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = isVisitorId(existing) ? existing : crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");
  headers.delete("content-length");
  const forwarded = new Request(request.url, {
    method: "POST", headers,
    body: JSON.stringify({ readId: dailyPublicationReadId(visitorId, upstreamPath) }),
  });
  const upstream = await proxyAuthenticatedApiRequest(forwarded, upstreamPath, { allowAnonymous: true });
  if (isVisitorId(existing)) return upstream;
  const response = new NextResponse(upstream.body, { status: upstream.status, headers: upstream.headers });
  response.cookies.set({
    name: VISITOR_COOKIE, value: visitorId, httpOnly: true, sameSite: "lax", path: "/",
    secure: new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
