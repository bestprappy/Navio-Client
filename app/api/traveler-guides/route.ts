import type { NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

/**
 * Exact routes (this list, and `[id]`) instead of an optional catch-all: a
 * catch-all here shadowed the deeper discovery/feedback routes in `next dev`.
 */
export function GET(request: NextRequest) {
  return proxyAuthenticatedApiRequest(request, "/v1/traveler-guides", { allowAnonymous: true });
}
