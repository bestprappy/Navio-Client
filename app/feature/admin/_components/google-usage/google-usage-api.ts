import { AdminApiError, describeAdminFailure } from "../admin-api";
import { googleUsageSchema, type GoogleUsageReport } from "./google-usage-model";

const REQUEST_TIMEOUT_MS = 20_000;

export const googleUsageKeys = { root: ["admin", "google-usage"] as const };

/** Reads Navio's own counters. This never calls Google, so refreshing costs nothing. */
export async function fetchGoogleUsage(signal?: AbortSignal): Promise<GoogleUsageReport> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch("/api/admin/google-usage", {
      cache: "no-store",
      credentials: "same-origin",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AdminApiError("Could not reach Navio to load Google usage. Try again.", 0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AdminApiError(describeAdminFailure(response.status, body), response.status);
  }

  const parsed = googleUsageSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Google usage response had an unexpected shape.", {
      component: "google-usage-api",
      operation: "fetchGoogleUsage",
      issues: parsed.error.issues.slice(0, 3).map((issue) => issue.path.join(".")),
    });
    throw new AdminApiError("Navio returned usage it could not read. Try again.", 502);
  }
  return parsed.data;
}
