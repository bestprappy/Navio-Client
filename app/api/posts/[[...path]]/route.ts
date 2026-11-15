import { NextRequest, NextResponse } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

/** Up to ten pictures of at most 5 MiB each, 20 MiB together, plus the post itself. */
const MAX_POST_UPLOAD_BYTES = 21 * 1024 * 1024;

async function proxyPostRequest(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  if (path.some((part) => !part || /[\\/]/.test(part) || part === "." || part === "..")) {
    return NextResponse.json({ message: "Invalid post path." }, { status: 400 });
  }
  return proxyAuthenticatedApiRequest(request, `/v1/posts${path.length ? `/${path.map(encodeURIComponent).join("/")}` : ""}`, {
    allowAnonymous: request.method === "GET" && (path.length <= 1 ||
      (path.length === 2 && ["image", "comments"].includes(path[1])) ||
      (path.length === 3 && path[1] === "images" && /^\d{1,2}$/.test(path[2]))),
    maxUploadBytes: request.method === "POST" && path.length === 0 ? MAX_POST_UPLOAD_BYTES : undefined,
  });
}

export const GET = proxyPostRequest;
export const POST = proxyPostRequest;
export const PATCH = proxyPostRequest;
export const PUT = proxyPostRequest;
export const DELETE = proxyPostRequest;
