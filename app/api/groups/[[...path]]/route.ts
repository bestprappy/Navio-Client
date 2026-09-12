import { NextRequest, NextResponse } from "next/server";

import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

type GroupProxyContext = { params: Promise<{ path?: string[] }> };

async function proxyGroupRequest(
  request: NextRequest,
  context: GroupProxyContext,
) {
  const { path = [] } = await context.params;
  // Reject URL-normalizing segments before constructing the upstream path.
  if (
    path.some(
      (part) => !part || /[\\/]/.test(part) || part === "." || part === "..",
    )
  ) {
    return NextResponse.json(
      { message: "Invalid community path." },
      { status: 400 },
    );
  }
  const allowAnonymous =
    request.method === "GET" &&
    (path.length === 0 || (path.length === 1 && path[0] !== "mine") ||
      (path.length === 2 && path[1] === "banner"));
  const suffix = path.length
    ? `/${path.map(encodeURIComponent).join("/")}`
    : "";
  return proxyAuthenticatedApiRequest(request, `/v1/groups${suffix}`, {
    allowAnonymous,
  });
}

export const GET = proxyGroupRequest;
export const POST = proxyGroupRequest;
export const PATCH = proxyGroupRequest;
export const PUT = proxyGroupRequest;
export const DELETE = proxyGroupRequest;
