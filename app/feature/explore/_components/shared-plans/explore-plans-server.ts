import "server-only";

import {
  EXPLORE_PAGE_SIZE,
  explorePlanSchema,
  isShareToken,
  parseExplorePlansPage,
  type ExplorePlan,
  type ExplorePlansPage,
  type ExploreSort,
} from "./explore-plans-api";

/** Short: the Explore route waits on this before painting, and the section can retry in the browser. */
const UPSTREAM_TIMEOUT_MS = 4_000;
const MAX_PAGE_SIZE = 48;

export type ExplorePlansResult =
  | { status: "ok"; page: ExplorePlansPage }
  | { status: "error"; httpStatus: number };

export type ExplorePlanSummaryResult =
  | { status: "ok"; plan: ExplorePlan }
  | { status: "not-listed" }
  | { status: "error"; httpStatus: number };

function gatewayUrl(path: string): URL | null {
  const backendBaseUrl = process.env.NAVIO_API_BASE_URL;
  if (!backendBaseUrl) {
    console.error("The Navio API gateway is not configured.", { component: "ExplorePlans" });
    return null;
  }
  try {
    return new URL(path, backendBaseUrl.endsWith("/") ? backendBaseUrl : `${backendBaseUrl}/`);
  } catch {
    console.error("The Navio API gateway URL is invalid.", { component: "ExplorePlans" });
    return null;
  }
}

/**
 * Reads the Explore feed from the gateway with no credentials attached.
 *
 * <p>The feed is the same for everyone, so nothing about the visitor is sent.
 * Not cached: an owner who unlists a plan expects it gone on the next load.
 */
export async function fetchExplorePlansFromGateway(
  page = 0,
  size = EXPLORE_PAGE_SIZE,
  sort: ExploreSort = "recent",
): Promise<ExplorePlansResult> {
  const upstreamUrl = gatewayUrl("/v1/shared-plans");
  if (!upstreamUrl) return { status: "error", httpStatus: 503 };
  upstreamUrl.searchParams.set("page", String(Math.max(0, Math.trunc(page))));
  upstreamUrl.searchParams.set("size", String(Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(size)))));
  upstreamUrl.searchParams.set("sort", sort);

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

/**
 * One listed plan's Explore card, with no credentials attached. The gateway and
 * the service answer only for plans listed right now; an unlisted, revoked or
 * unknown token is the same "not-listed" answer.
 */
export async function fetchExplorePlanSummaryFromGateway(
  token: string,
): Promise<ExplorePlanSummaryResult> {
  if (!isShareToken(token)) return { status: "not-listed" };
  const upstreamUrl = gatewayUrl(`/v1/shared-plans/${encodeURIComponent(token)}/summary`);
  if (!upstreamUrl) return { status: "error", httpStatus: 503 };

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (response.status === 404) return { status: "not-listed" };
    if (!response.ok) {
      console.error("Explore plan card request failed.", {
        component: "ExplorePlans",
        status: response.status,
      });
      return { status: "error", httpStatus: 502 };
    }
    const parsed = explorePlanSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("Explore plan card had an unexpected shape.", { component: "ExplorePlans" });
      return { status: "error", httpStatus: 502 };
    }
    return { status: "ok", plan: parsed.data };
  } catch (error) {
    console.error("Explore plan card request failed.", {
      component: "ExplorePlans",
      error: error instanceof Error ? error.name : "Unknown error",
    });
    return { status: "error", httpStatus: 502 };
  }
}
