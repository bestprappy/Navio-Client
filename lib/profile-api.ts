import { apiRequest, uploadWithProgress } from "@/lib/api-client";
import { userProfileSchema } from "@/lib/validations/profile";
import { securityOverviewSchema, usernameAvailabilitySchema } from "@/lib/validations/social";
import type {
  ProfileFormValues,
  PublicProfileFormInput,
  PublicProfileFormValues,
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
  init?: { method: "PATCH" | "POST" | "DELETE"; body?: unknown },
): Promise<UserProfile> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: init && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json", Accept: "application/json" }
        : { Accept: "application/json" },
      body: init?.body instanceof FormData ? init.body : init?.body !== undefined ? JSON.stringify(init.body) : undefined,
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
  if (response.ok && response.status === 204) return getMyProfile();
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

export function uploadProfilePicture(file: File): Promise<UserProfile> {
  const body = new FormData(); body.append("file", file);
  return requestProfile("/api/users/me/picture", "uploadProfilePicture", { method: "POST", body });
}

export function removeProfilePicture(): Promise<UserProfile> {
  return requestProfile("/api/users/me/picture", "removeProfilePicture", { method: "DELETE" });
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
  if (values.displayName !== baseline.displayName) patch.displayName = values.displayName.trim();

  return requestProfile("/api/users/me", "updateMyProfile", {
    method: "PATCH",
    body: patch,
  });
}

export function toProfileFormValues(profile: UserProfile): ProfileFormValues {
  return { displayName: profile.displayName };
}

// --- Public profile, banner and account security ------------------------------

/** Same as {@link uploadProfilePicture} but reports upload progress. */
export function uploadProfilePictureWithProgress(file: File, onProgress: (percent: number) => void): Promise<UserProfile> {
  return uploadWithProgress("/api/users/me/picture", file, {
    schema: userProfileSchema, operation: "uploadProfilePicture", onProgress,
  });
}

export function uploadProfileBanner(file: File, onProgress: (percent: number) => void): Promise<UserProfile> {
  return uploadWithProgress("/api/users/me/banner", file, {
    schema: userProfileSchema, operation: "uploadProfileBanner", onProgress,
  });
}

export async function removeProfileBanner(): Promise<UserProfile> {
  await apiRequest("/api/users/me/banner", { method: "DELETE", operation: "removeProfileBanner" });
  return getMyProfile();
}

/** The fields of Settings > Profile that differ from the saved profile; empty when nothing changed. */
export function publicProfilePatch(values: PublicProfileFormValues, profile: UserProfile): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (values.displayName.trim() !== profile.displayName) patch.displayName = values.displayName.trim();
  if (values.username !== (profile.username ?? "")) patch.username = values.username;
  if (values.bio.trim() !== profile.bio.trim()) patch.bio = values.bio.trim();
  const interestsChanged =
    values.travelInterests.length !== profile.travelInterests.length ||
    values.travelInterests.some((interest, index) => interest !== profile.travelInterests[index]);
  if (interestsChanged) patch.travelInterests = values.travelInterests;
  if (values.travelPace !== (profile.travelPace ?? "")) patch.travelPace = values.travelPace;
  return patch;
}

export function savePublicProfile(patch: Record<string, unknown>): Promise<UserProfile> {
  return apiRequest("/api/users/me", { method: "PATCH", body: patch, schema: userProfileSchema, operation: "savePublicProfile" });
}

export function setShowTravelPreferences(show: boolean): Promise<UserProfile> {
  return apiRequest("/api/users/me", {
    method: "PATCH", body: { showTravelPreferences: show }, schema: userProfileSchema, operation: "setShowTravelPreferences",
  });
}

export function checkUsername(username: string, signal?: AbortSignal) {
  return apiRequest(`/api/users/username-availability?username=${encodeURIComponent(username)}`, {
    schema: usernameAvailabilitySchema, operation: "checkUsername", signal,
  });
}

export function getSecurityOverview(signal?: AbortSignal) {
  return apiRequest("/api/users/me/security", { schema: securityOverviewSchema, operation: "getSecurityOverview", signal });
}

/** Ends every session. Rejects with code `reauthentication_required` when the sign-in is too old. */
export function signOutEverywhere() {
  return apiRequest("/api/users/me/sessions/revoke", { method: "POST", operation: "signOutEverywhere" });
}

export function toPublicProfileForm(profile: UserProfile): PublicProfileFormInput {
  return {
    displayName: profile.displayName,
    username: profile.username ?? "",
    bio: profile.bio,
    travelInterests: profile.travelInterests,
    travelPace: (["relaxed", "balanced", "packed"].includes(profile.travelPace ?? "") ? profile.travelPace : "") as PublicProfileFormInput["travelPace"],
  };
}
