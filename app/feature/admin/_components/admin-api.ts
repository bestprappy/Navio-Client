import { z } from "zod";

/**
 * Transport for the admin console.
 *
 * Every call goes through the authenticated Next.js proxy at `/api/admin/users`,
 * which attaches the access token server-side. The backend authorizes each
 * request; nothing here decides who may do what.
 *
 * The backend says "suspend"; the console says "ban". The mapping lives here
 * and in `userStatusLabel`, nowhere else.
 */

const REQUEST_TIMEOUT_MS = 20_000;
const BASE_PATH = "/api/admin/users";

export const ADMIN_PAGE_SIZE = 20;
export const REASON_MIN_LENGTH = 3;
export const REASON_MAX_LENGTH = 2000;

const roleSchema = z.enum(["USER", "MODERATOR", "ADMIN"]);
export const userStatusSchema = z.enum(["active", "suspended", "deleted"]);

export const adminUserSummarySchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  email: z.string(),
  status: userStatusSchema,
  roles: z.array(roleSchema),
  createdAt: z.string(),
  suspendedUntil: z.string().nullable(),
});

export const adminUserPageSchema = z.object({
  content: z.array(adminUserSummarySchema),
  number: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const adminStatisticsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  suspendedUsers: z.number().int().nonnegative(),
  joinedLast30Days: z.number().int().nonnegative(),
  joinedSince: z.string(),
  asOf: z.string(),
});

export const adminUserDetailSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  email: z.string(),
  status: userStatusSchema,
  roles: z.array(roleSchema),
  rolesVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  activeSuspension: z
    .object({
      reason: z.string(),
      startsAt: z.string(),
      endsAt: z.string().nullable(),
      bannedByUserId: z.string().uuid(),
      bannedByDisplayName: z.string().nullable(),
    })
    .nullable(),
});

export const moderationEventSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  actorUserId: z.string().uuid().nullable(),
  actorDisplayName: z.string().nullable(),
  reason: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.string(),
});

export const moderationEventPageSchema = z.object({
  content: z.array(moderationEventSchema),
  number: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const moderationResultSchema = z.object({
  userId: z.string().uuid(),
  status: userStatusSchema,
  reason: z.string().nullable(),
  expiresAt: z.string().nullable(),
  updatedAt: z.string(),
});

export const moderationReasonSchema = z
  .string()
  .trim()
  .min(REASON_MIN_LENGTH, `Write at least ${REASON_MIN_LENGTH} characters.`)
  .max(REASON_MAX_LENGTH, `Keep it under ${REASON_MAX_LENGTH} characters.`);

export type AdminRole = z.infer<typeof roleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;
export type AdminUserPage = z.infer<typeof adminUserPageSchema>;
export type AdminStatistics = z.infer<typeof adminStatisticsSchema>;
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;
export type ModerationEvent = z.infer<typeof moderationEventSchema>;
export type ModerationEventPage = z.infer<typeof moderationEventPageSchema>;
export type ModerationResult = z.infer<typeof moderationResultSchema>;
export type ModerationAction = "ban" | "unban";

export type AdminUserSearch = {
  term: string;
  status: UserStatus | null;
  page: number;
};

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

function readUpstreamMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

/** Turns a failed response into a sentence someone can act on. */
export function describeAdminFailure(status: number, body: unknown, isMutation = false): string {
  if (isMutation && status >= 500) {
    return "Navio did not confirm the change. Refresh the account to check its current state before trying again.";
  }
  const upstream = readUpstreamMessage(body);
  switch (status) {
    case 401:
      return "Your session has ended. Sign in again to continue.";
    case 403:
      // The backend explains privilege refusals ("Only an administrator can…").
      return upstream && upstream !== "You do not have permission to perform this action"
        ? upstream
        : "Your account does not have access to this.";
    case 404:
      return "This account no longer exists.";
    case 409:
      // "This account is already suspended" and similar: someone acted first.
      return upstream
        ? `${upstream.replace(/suspended/g, "banned")}. Refresh to see its current state.`
        : "This account changed since you opened it. Refresh and try again.";
    case 400:
    case 422:
      return upstream ?? "Some details were rejected. Review them and try again.";
    case 503:
    case 502:
    case 504:
      return "Navio is temporarily unavailable. Try again in a moment.";
    default:
      return upstream ?? "The Navio service could not complete this. Try again.";
  }
}

async function adminRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  operation: string,
  init?: { method: "POST"; body: unknown },
): Promise<T> {
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
    const timedOut = cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError");
    console.error("Admin request could not be sent.", { component: "admin-api", operation, timedOut });
    throw new AdminApiError(
      init
        ? "Navio did not confirm the change. Refresh the account to check its current state before trying again."
        : timedOut
        ? "The request took too long. Check your connection and try again."
        : "Could not reach Navio. Check your connection and try again.",
      0,
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Admin request failed.", { component: "admin-api", operation, status: response.status });
    throw new AdminApiError(describeAdminFailure(response.status, body, Boolean(init)), response.status);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Admin response had an unexpected shape.", {
      component: "admin-api",
      operation,
      issues: parsed.error.issues.slice(0, 3).map((issue) => issue.path.join(".")),
    });
    throw new AdminApiError("Navio returned data this page cannot read. Refresh to try again.", response.status);
  }
  return parsed.data;
}

export function adminUserSearchParams(search: AdminUserSearch): URLSearchParams {
  const params = new URLSearchParams({ page: String(search.page), size: String(ADMIN_PAGE_SIZE) });
  const term = search.term.trim();
  if (term) params.set("term", term);
  if (search.status) params.set("status", search.status.toUpperCase());
  return params;
}

export function fetchAdminStatistics(): Promise<AdminStatistics> {
  return adminRequest(`${BASE_PATH}/statistics`, adminStatisticsSchema, "statistics");
}

export function searchAdminUsers(search: AdminUserSearch): Promise<AdminUserPage> {
  return adminRequest(`${BASE_PATH}?${adminUserSearchParams(search)}`, adminUserPageSchema, "search");
}

/** A short list for the dashboard, newest first. */
export function fetchAdminUserSample(status: UserStatus | null, size: number): Promise<AdminUserPage> {
  const params = new URLSearchParams({ page: "0", size: String(size) });
  if (status) params.set("status", status.toUpperCase());
  return adminRequest(`${BASE_PATH}?${params}`, adminUserPageSchema, "sample");
}

export function fetchAdminUser(userId: string): Promise<AdminUserDetail> {
  return adminRequest(`${BASE_PATH}/${encodeURIComponent(userId)}`, adminUserDetailSchema, "detail");
}

export function fetchModerationEvents(userId: string, page = 0): Promise<ModerationEventPage> {
  return adminRequest(
    `${BASE_PATH}/${encodeURIComponent(userId)}/moderation-events?page=${page}&size=20`,
    moderationEventPageSchema,
    "moderation-events",
  );
}

export function moderateUser(userId: string, action: ModerationAction, reason: string): Promise<ModerationResult> {
  const endpoint = action === "ban" ? "suspend" : "reactivate";
  return adminRequest(
    `${BASE_PATH}/${encodeURIComponent(userId)}/${endpoint}`,
    moderationResultSchema,
    action,
    { method: "POST", body: { reason: reason.trim() } },
  );
}

export function userStatusLabel(status: UserStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "suspended":
      return "Banned";
    case "deleted":
      return "Deleted";
  }
}

export function moderationEventLabel(event: Pick<ModerationEvent, "action" | "role">): string {
  switch (event.action) {
    case "USER_SUSPENDED":
      return "Banned";
    case "USER_REACTIVATED":
      return "Unbanned";
    case "USER_ROLE_GRANTED":
      return event.role ? `Made ${roleLabel(event.role)}` : "Role granted";
    case "USER_ROLE_REVOKED":
      return event.role ? `${roleLabel(event.role)} role removed` : "Role removed";
    default:
      return "Account changed";
  }
}

export function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "MODERATOR":
      return "Moderator";
    case "USER":
      return "Member";
    default:
      return role;
  }
}

/** Only these roles are worth showing; every account is a USER. */
export function staffRoles(roles: readonly AdminRole[]): AdminRole[] {
  return roles.filter((role) => role !== "USER");
}
