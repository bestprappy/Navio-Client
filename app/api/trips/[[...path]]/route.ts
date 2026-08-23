import { NextRequest, NextResponse } from "next/server";

const DEVELOPMENT_USER_ID = "00000000-0000-0000-0000-000000000001";

type TripProxyContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyTripRequest(
  request: NextRequest,
  context: TripProxyContext,
): Promise<NextResponse> {
  const { path = [] } = await context.params;
  const baseUrl = process.env.NAVIO_API_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { message: "The Navio API gateway is not configured." },
      { status: 503 },
    );
  }

  const upstreamPath = path.length > 0 ? `/${path.map(encodeURIComponent).join("/")}` : "";
  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(`/v1/trips${upstreamPath}`, baseUrl);
  } catch (error) {
    console.error("The Navio API gateway URL is invalid.", {
      operation: "proxyTripRequest",
      error,
    });
    return NextResponse.json(
      { message: "The Navio API gateway is not configured correctly." },
      { status: 503 },
    );
  }
  upstreamUrl.search = request.nextUrl.search;

  const userId =
    request.headers.get("X-User-Id") ??
    process.env.NAVIO_DEV_USER_ID ??
    (process.env.NODE_ENV === "production" ? null : DEVELOPMENT_USER_ID);

  if (!userId) {
    return NextResponse.json(
      { message: "Authentication is required to access trips." },
      { status: 401 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    "X-User-Id": userId,
  });
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  if (contentType) headers.set("Content-Type", contentType);
  if (authorization) headers.set("Authorization", authorization);

  try {
    const body = request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: body || undefined,
      cache: "no-store",
      signal: request.signal,
    });
    const responseBody = await response.arrayBuffer();
    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    if (responseContentType) {
      responseHeaders.set("Content-Type", responseContentType);
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Trip API proxy request failed.", {
      operation: "proxyTripRequest",
      method: request.method,
      upstreamUrl: upstreamUrl.toString(),
      error,
    });
    return NextResponse.json(
      { message: "The trip service is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export const GET = proxyTripRequest;
export const POST = proxyTripRequest;
export const PUT = proxyTripRequest;
export const PATCH = proxyTripRequest;
export const DELETE = proxyTripRequest;
