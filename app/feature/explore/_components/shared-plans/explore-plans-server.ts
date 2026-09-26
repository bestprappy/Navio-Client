import "server-only";

import {
  EXPLORE_PAGE_SIZE,
  parseExplorePlansPage,
  type ExplorePlansPage,
} from "./explore-plans-api";

/** Short: the Explore route waits on this before painting, and the section can retry in the browser. */
const UPSTREAM_TIMEOUT_MS = 4_000;
const MAX_PAGE_SIZE = 48;

export type ExplorePlansResult =
  | { status: "ok"; page: ExplorePlansPage }
  | { status: "error"; httpStatus: number };

/**
 * Reads the Explore feed from the gateway with no credentials attached.
 *
 * <p>The feed is the same for everyone, so nothing about the visitor is sent.
 * Not cached: an owner who unlists a plan expects it gone on the next load.
 */
export async function fetchExplorePlansFromGateway(
  page = 0,
  size = EXPLORE_PAGE_SIZE,
): Promise<ExplorePlansResult> {
  const backendBaseUrl = process.env.NAVIO_API_BASE_URL;
  if (!backendBaseUrl) {
    console.error("The Navio API gateway is not configured.", { component: "ExplorePlans" });
    return { status: "error", httpStatus: 503 };
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(
      "/v1/shared-plans",
      backendBaseUrl.endsWith("/") ? backendBaseUrl : `${backendBaseUrl}/`,
    );
  } catch {
    console.error("The Navio API gateway URL is invalid.", { component: "ExplorePlans" });
    return { status: "error", httpStatus: 503 };
  }
  upstreamUrl.searchParams.set("page", String(Math.max(0, Math.trunc(page))));
  upstreamUrl.searchParams.set("size", String(Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(size)))));

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("Explore feed request failed.", {
        component: "ExplorePlans",
        status: response.status,
      });
      return { status: "error", httpStatus: response.status >= 500 ? 502 : response.status };
    }
    return { status: "ok", page: parseExplorePlansPage(await response.json()) };
  } catch (error) {
    console.error("Explore feed request failed.", {
      component: "ExplorePlans",
      error: error instanceof Error ? error.name : "Unknown error",
    });
    return { status: "error", httpStatus: 502 };
  }
}
