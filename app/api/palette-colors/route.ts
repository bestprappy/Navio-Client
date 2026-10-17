import type { NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

/** The shared palette. Guests need it too, to read a shared plan in its owner's colors. */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedApiRequest(request, "/v1/palette-colors", { allowAnonymous: true });
}
