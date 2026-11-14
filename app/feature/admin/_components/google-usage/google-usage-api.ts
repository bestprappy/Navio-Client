import { AdminApiError, describeAdminFailure } from "../admin-api";
import { googleUsageSchema, type GoogleUsageReport } from "./google-usage-model";

const REQUEST_TIMEOUT_MS = 20_000;
const BASE_PATH = "/api/admin/google-usage";

export const googleUsageKeys = { root: ["admin", "google-usage"] as const };

/** Reads Navio's own counters. This never calls Google, so refreshing costs nothing. */
export async function fetchGoogleUsage(signal?: AbortSignal): Promise<GoogleUsageReport> {
  return requestReport(BASE_PATH, { method: "GET" }, "fetchGoogleUsage", "load Google usage", signal);
}

/** Lets this month's Google calls continue past their limits, or stops them at the limits again. */
export async function updateLimitOverride(ignoreLimits: boolean): Promise<GoogleUsageReport> {
  return requestReport(
    `${BASE_PATH}/limit-override`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ignoreLimits }) },
    "updateLimitOverride",
    ignoreLimits ? "ignore the limits" : "restore the limits",
  );
}

async function requestReport(
  path: string,
  init: RequestInit,
  operation: string,
  action: string,
  signal?: AbortSignal,
): Promise<GoogleUsageReport> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AdminApiError(`Could not reach Navio to ${action}. Try again.`, 0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AdminApiError(describeAdminFailure(response.status, body), response.status);
  }

  const parsed = googleUsageSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Google usage response had an unexpected shape.", {
      component: "google-usage-api",
      operation,
      issues: parsed.error.issues.slice(0, 3).map((issue) => issue.path.join(".")),
    });
    throw new AdminApiError("Navio returned usage it could not read. Try again.", 502);
  }
  return parsed.data;
}
