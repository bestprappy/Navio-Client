import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_DISTANCE_UNIT,
  DEFAULT_LOCALE,
} from "@/components/profile/data";
import { userProfileSchema } from "@/lib/validations/profile";
import type {
  PreferencesFormValues,
  ProfileFormValues,
  UserProfile,
} from "@/types/profile";

/**
 * Transport for the caller's own profile.
 *
 * Every request goes through the authenticated Next.js proxy under
 * `/api/users/*`, which attaches the access token server-side. Nothing here
 * touches the browser's own storage: the user-management service is the only
 * place a profile lives.
 */

const REQUEST_TIMEOUT_MS = 20_000;

export function currentUserProfileQueryKey(userId?: string | null) {
  return ["current-user-profile", userId ?? "me"] as const;
}

/** The proxy answers with `{ message }` on failure; upstream errors may not. */
function readErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

function describeFailure(status: number, body: unknown): string {
  const upstream = readErrorMessage(body);
  if (status === 401 || status === 403) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 400 || status === 422) {
    return upstream ?? "Some details were rejected. Please review and try again.";
  }
  if (status === 404) {
    return "We could not find your Navio profile.";
  }
  if (status === 409) {
    return "Your profile changed elsewhere. Reload to get the latest version.";
  }
  if (status === 429) {
    return "Too many updates at once. Please wait a moment and try again.";
  }
  return upstream ?? "The Navio service is temporarily unavailable. Please try again.";
}

async function requestProfile(
  path: string,
  operation: string,
  init?: { method: "PATCH"; body: unknown },
): Promise<UserProfile> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: init
        ? { "Content-Type": "application/json", Accept: "application/json" }
        : { Accept: "application/json" },
      body: init ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut =
      cause instanceof Error &&
      (cause.name === "TimeoutError" || cause.name === "AbortError");
    console.error("The profile request could not be sent.", {
      component: "profile-api",
      operation,
      path,
      timedOut,
      cause,
    });
    throw new Error(
      timedOut
        ? "The request took too long. Please check your connection and try again."
        : "We could not reach Navio. Please check your connection and try again.",
    );
  }

  // A gateway error page is not JSON, so parsing has to be allowed to fail.
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    console.error("The Navio profile service rejected a request.", {
      component: "profile-api",
      operation,
      path,
      status: response.status,
    });
    throw new Error(describeFailure(response.status, body));
  }

  const parsed = userProfileSchema.safeParse(body);
  if (!parsed.success) {
    console.error("The Navio profile response did not match the expected shape.", {
      component: "profile-api",
      operation,
      path,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    });
    throw new Error("We received an unexpected response from Navio. Please try again.");
  }

  return parsed.data;
}

export function getMyProfile(): Promise<UserProfile> {
  return requestProfile("/api/users/me", "getMyProfile");
}

/**
 * Sends only the fields that actually changed. The server treats null as
 * "leave unchanged", so an unchanged key is simply omitted rather than
 * re-written on every keystroke.
 */
export function updateMyProfile(
  values: ProfileFormValues,
  baseline: ProfileFormValues,
): Promise<UserProfile> {
  const patch: Partial<ProfileFormValues> = {};
  if (values.displayName !== baseline.displayName) patch.displayName = values.displayName;
  if (values.locale !== baseline.locale) patch.locale = values.locale;
  if (values.countryCode !== baseline.countryCode) patch.countryCode = values.countryCode;

  return requestProfile("/api/users/me", "updateMyProfile", {
    method: "PATCH",
    body: patch,
  });
}

/**
 * Preferences are merged server-side, so only the changed keys are sent.
 * `language` is deliberately never included — the profile-level `locale` is the
 * field this UI edits.
 */
export function updateMyPreferences(
  values: PreferencesFormValues,
  baseline: PreferencesFormValues,
): Promise<UserProfile> {
  const patch: Partial<PreferencesFormValues> = {};
  if (values.distanceUnit !== baseline.distanceUnit) patch.distanceUnit = values.distanceUnit;
  if (values.notificationEmail !== baseline.notificationEmail) {
    patch.notificationEmail = values.notificationEmail;
  }
  if (values.notificationPush !== baseline.notificationPush) {
    patch.notificationPush = values.notificationPush;
  }

  return requestProfile("/api/users/me/preferences", "updateMyPreferences", {
    method: "PATCH",
    body: patch,
  });
}

export function toProfileFormValues(profile: UserProfile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    locale: profile.locale ?? DEFAULT_LOCALE,
    countryCode: (profile.countryCode ?? DEFAULT_COUNTRY_CODE).toUpperCase(),
  };
}

export function toPreferencesFormValues(profile: UserProfile): PreferencesFormValues {
  return {
    distanceUnit: profile.preferences.distanceUnit === "mi" ? "mi" : DEFAULT_DISTANCE_UNIT,
    notificationEmail: profile.preferences.notificationEmail,
    notificationPush: profile.preferences.notificationPush,
  };
}
