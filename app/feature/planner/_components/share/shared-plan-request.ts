import "server-only";

import { readSharedPlanResponse, type SharedPlan } from "./publication-api";

const UPSTREAM_TIMEOUT_MS = 15_000;

/** Distinguishes "the link is dead" from "we could not reach the service". */
export type SharedPlanResult =
  | { status: "ok"; plan: SharedPlan }
  | { status: "unavailable" }
  | { status: "error" };

/**
 * Fetches a published plan from the gateway, on the server.
 *
 * <p>No credentials are attached and none are available here: the token in the
 * URL is the only thing that authorises this read, so the response cannot vary
 * with who is looking. Nothing is cached — revoking a link has to take effect on
 * the next request, and a cached render would outlive the owner's decision.
 */
export async function fetchSharedPlan(token: string): Promise<SharedPlanResult> {
  const backendBaseUrl = process.env.NAVIO_API_BASE_URL;
  if (!backendBaseUrl) {
    console.error("The Navio API gateway is not configured.", { component: "SharedPlanPage" });
    return { status: "error" };
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(
      `/v1/shared-plans/${encodeURIComponent(token)}`,
      backendBaseUrl.endsWith("/") ? backendBaseUrl : `${backendBaseUrl}/`,
    );
  } catch {
    console.error("The Navio API gateway URL is invalid.", { component: "SharedPlanPage" });
    return { status: "error" };
  }

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    // 404 and 410 are the service's one answer for every dead-link cause, and it
    // is deliberately undetailed; anything else is our fault, not the link's.
    if (response.status === 404 || response.status === 410) return { status: "unavailable" };
    if (!response.ok) {
      // The token is never logged: it is the credential.
      console.error("Shared plan request failed.", {
        component: "SharedPlanPage",
        status: response.status,
      });
      return { status: "error" };
    }

    return { status: "ok", plan: readSharedPlanResponse(await response.json()) };
  } catch (error) {
    console.error("Shared plan request failed.", {
      component: "SharedPlanPage",
      error: error instanceof Error ? error.name : "Unknown error",
    });
    return { status: "error" };
  }
}
