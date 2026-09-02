import "server-only";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

const UPSTREAM_TIMEOUT_MS = 15_000;
const RESPONSE_HEADERS_TO_FORWARD = [
  "cache-control",
  "content-type",
  "retry-after",
  "www-authenticate",
  "x-request-id",
] as const;

export async function proxyAuthenticatedApiRequest(
  request: Request,
  upstreamPath: string,
): Promise<Response> {
  const session = await auth();
  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { message: "Authentication is required." },
      { status: 401 },
    );
  }

  const backendBaseUrl = process.env.NAVIO_API_BASE_URL;
  if (!backendBaseUrl) {
    return NextResponse.json(
      { message: "The Navio API gateway is not configured." },
      { status: 503 },
    );
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(
      upstreamPath,
      backendBaseUrl.endsWith("/") ? backendBaseUrl : `${backendBaseUrl}/`,
    );
    upstreamUrl.search = new URL(request.url).search;
  } catch (error) {
    console.error("The Navio API gateway URL is invalid.", {
      component: "AuthenticatedApiProxy",
      error: error instanceof Error ? error.message : "Unknown URL error",
    });
    return NextResponse.json(
      { message: "The Navio API gateway is not configured correctly." },
      { status: 503 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${session.accessToken}`,
  });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const hasRequestBody = request.method !== "GET" && request.method !== "HEAD";
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: hasRequestBody ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const responseHeaders = new Headers();
    for (const headerName of RESPONSE_HEADERS_TO_FORWARD) {
      const value = response.headers.get(headerName);
      if (value) responseHeaders.set(headerName, value);
    }

    const hasNoBody = response.status === 204 || response.status === 304;
    return new Response(hasNoBody ? null : await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    console.error("Authenticated Navio API request failed.", {
      component: "AuthenticatedApiProxy",
      method: request.method,
      upstreamPath,
      timedOut,
    });
    return NextResponse.json(
      {
        message: timedOut
          ? "The Navio service took too long to respond."
          : "The Navio service is temporarily unavailable.",
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}
