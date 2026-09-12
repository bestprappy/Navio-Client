import "server-only";

import { NextResponse } from "next/server";

import type { Session } from "next-auth";
import { withAuthenticatedSession } from "./with-authenticated-session";
import { isCrossOriginMutation, readUploadBody, UploadTooLargeError } from "./upload-request";

const UPSTREAM_TIMEOUT_MS = 15_000;
const RESPONSE_HEADERS_TO_FORWARD = [
  "cache-control",
  "content-type",
  "retry-after",
  "www-authenticate",
  "x-request-id",
  "x-content-type-options",
] as const;

export async function proxyAuthenticatedApiRequest(
  request: Request,
  upstreamPath: string,
  options: { allowAnonymous?: boolean } = {},
): Promise<Response> {
  if (isCrossOriginMutation(request, process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)) {
    return NextResponse.json({ message: "This request must come from Navio." }, { status: 403 });
  }
  return withAuthenticatedSession(request, (authenticatedRequest, session) =>
    forwardAuthenticatedApiRequest(authenticatedRequest, upstreamPath, options, session),
  );
}

async function forwardAuthenticatedApiRequest(
  request: Request,
  upstreamPath: string,
  options: { allowAnonymous?: boolean },
  session: Session | null,
): Promise<Response> {
  if ((!session?.accessToken || session.error) && !options.allowAnonymous) {
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
  });
  if (session?.accessToken && !session.error) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const hasRequestBody =
      request.method !== "GET" && request.method !== "HEAD";
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: hasRequestBody
        ? contentType?.toLowerCase().startsWith("multipart/form-data")
          ? await readUploadBody(request)
          : await request.arrayBuffer()
        : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const responseHeaders = new Headers();
    for (const headerName of RESPONSE_HEADERS_TO_FORWARD) {
      const value = response.headers.get(headerName);
      if (value) responseHeaders.set(headerName, value);
    }
    responseHeaders.set("Cache-Control", "private, no-store");

    const hasNoBody = response.status === 204 || response.status === 304;
    return new Response(hasNoBody ? null : await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof UploadTooLargeError) {
      return NextResponse.json({ message: "Upload request must be at most 6 MiB." }, { status: 413 });
    }
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
