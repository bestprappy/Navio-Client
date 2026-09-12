import "server-only";

import type { Session } from "next-auth";
import { NextRequest } from "next/server";

import { auth } from "@/auth";

export async function withAuthenticatedSession(
  request: Request,
  handler: (request: Request, session: Session | null) => Promise<Response>,
): Promise<Response> {
  // App Router may proxy the request. Passing that proxy as Request input
  // makes Node read private fields from the proxy instead of its target.
  // Rebuild from public properties, keeping the body as a stream.
  const authRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  });

  // The auth wrapper copies rotated session cookies onto the final response.
  // Calling auth() without arguments here silently discards those cookies.
  const response = await auth((authenticatedRequest) =>
    handler(authenticatedRequest, authenticatedRequest.auth),
  )(authRequest, { params: Promise.resolve({}) });
  if (!response) throw new Error("The authenticated API handler returned no response.");
  return response;
}
