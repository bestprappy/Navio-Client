import "server-only";

import { NextResponse } from "next/server";

import { proxyAuthenticatedApiRequest } from "./authenticated-api-proxy";

/** True when every segment is a plain path component that cannot change the upstream route. */
export function isSafeSegments(segments: readonly string[]): boolean {
  return segments.every((part) => part.length > 0 && !/[\\/]/.test(part) && part !== "." && part !== "..");
}

/**
 * Forwards to `base` plus the given segments for a signed-in caller. Segments
 * that could normalise the URL (`..`, slashes) are refused before any request.
 */
export async function proxySegments(request: Request, base: string, segments: readonly string[]): Promise<Response> {
  if (!isSafeSegments(segments)) {
    return NextResponse.json({ message: "Invalid path." }, { status: 400 });
  }
  const suffix = segments.length ? `/${segments.map(encodeURIComponent).join("/")}` : "";
  return proxyAuthenticatedApiRequest(request, `${base}${suffix}`);
}
