import "server-only";

import type { Session } from "next-auth";
import { NextRequest } from "next/server";

import { auth } from "@/auth";

export async function withAuthenticatedSession(
  request: Request,
  handler: (request: Request, session: Session | null) => Promise<Response>,
): Promise<Response> {
  // The auth wrapper copies rotated session cookies onto the final response.
  // Calling auth() without arguments here silently discards those cookies.
  const response = await auth((authenticatedRequest) =>
    handler(authenticatedRequest, authenticatedRequest.auth),
  )(new NextRequest(request), { params: Promise.resolve({}) });
  if (!response) throw new Error("The authenticated API handler returned no response.");
  return response;
}
