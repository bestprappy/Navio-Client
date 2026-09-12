import { NextRequest, NextResponse } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

async function proxyPostRequest(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  if (path.some((part) => !part || /[\\/]/.test(part) || part === "." || part === "..")) {
    return NextResponse.json({ message: "Invalid post path." }, { status: 400 });
  }
  return proxyAuthenticatedApiRequest(request, `/v1/posts${path.length ? `/${path.map(encodeURIComponent).join("/")}` : ""}`, {
    allowAnonymous: request.method === "GET" && (path.length <= 1 ||
      (path.length === 2 && ["image", "comments"].includes(path[1]))),
  });
}

export const GET = proxyPostRequest;
export const POST = proxyPostRequest;
export const PATCH = proxyPostRequest;
export const PUT = proxyPostRequest;
export const DELETE = proxyPostRequest;
