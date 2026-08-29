import { NextResponse } from "next/server";

const UPSTREAM_TIMEOUT_MS = 15_000;
const REQUEST_HEADERS_TO_FORWARD = [
  "authorization",
  "content-type",
  "traceparent",
  "tracestate",
  "x-request-id",
] as const;
const RESPONSE_HEADERS_TO_FORWARD = [
  "cache-control",
  "content-type",
  "retry-after",
  "www-authenticate",
  "x-request-id",
] as const;

type MobilityProxyOptions = {
  method?: "GET" | "POST";
  body?: string;
};

export async function proxyMobilityRequest(
  request: Request,
  upstreamPath: string,
  options: MobilityProxyOptions = {},
): Promise<Response> {
  const backendBaseUrl = process.env.NAVIO_API_BASE_URL;

  if (!backendBaseUrl) {
    return NextResponse.json(
      { error: "The Navio backend is not configured." },
      { status: 503 },
    );
  }

  let upstreamUrl: URL;

  try {
    upstreamUrl = new URL(upstreamPath, normalizeBaseUrl(backendBaseUrl));
  } catch (error) {
    console.error("Mobility backend URL is invalid.", {
      component: "MobilityProxy",
      operation: options.method ?? "GET",
      error,
    });
    return NextResponse.json(
      { error: "The Navio backend configuration is invalid." },
      { status: 500 },
    );
  }

  const headers = createUpstreamHeaders(request.headers);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const responseHeaders = createClientHeaders(upstreamResponse.headers);
    const hasNoBody =
      upstreamResponse.status === 204 || upstreamResponse.status === 304;
    const body = hasNoBody ? null : await upstreamResponse.arrayBuffer();

    return new Response(body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const timedOut = isTimeoutError(error);

    console.error("Mobility backend request failed.", {
      component: "MobilityProxy",
      operation: options.method ?? "GET",
      timedOut,
      error,
    });

    return NextResponse.json(
      {
        error: timedOut
          ? "The mobility service took too long to respond."
          : "The mobility service is temporarily unavailable.",
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function createUpstreamHeaders(requestHeaders: Headers): Headers {
  const headers = new Headers();

  for (const headerName of REQUEST_HEADERS_TO_FORWARD) {
    const value = requestHeaders.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function createClientHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();

  for (const headerName of RESPONSE_HEADERS_TO_FORWARD) {
    const value = upstreamHeaders.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
