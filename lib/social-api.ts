import { z } from "zod";

import { postSchema } from "@/app/feature/community/_components/community-post-api";
import type { CommunityPost } from "@/app/feature/community/_components/data";
import { apiRequest } from "@/lib/api-client";
import {
  blockedUserSchema,
  connectionSchema,
  notificationPreferencesSchema,
  notificationSchema,
  pageSchema,
  profilePlanSchema,
  publicProfileSchema,
  socialSettingsSchema,
  socialSummarySchema,
  unreadCountSchema,
  type ConnectionsVisibility,
  type NotificationPreferences,
  type ReportReason,
  type ReportTargetType,
} from "@/lib/validations/social";

/** Query keys shared by every screen that shows the same social facts. */
export const socialKeys = {
  all: ["social"] as const,
  profileByUsername: (username: string) => ["social", "profile", "username", username.toLowerCase()] as const,
  profileByAccount: (accountId: string) => ["community-user", "profile", accountId] as const,
  summary: (accountId: string) => ["social", "summary", accountId] as const,
  connections: (accountId: string, kind: "followers" | "following", search: string) =>
    ["social", "connections", accountId, kind, search] as const,
  posts: (accountId: string) => ["social", "posts", accountId] as const,
  plans: (accountId: string) => ["social", "plans", accountId] as const,
  blocked: ["social", "blocked"] as const,
  settings: ["social", "settings"] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly: boolean) => ["notifications", "list", unreadOnly] as const,
  unread: ["notifications", "unread"] as const,
  preferences: ["notifications", "preferences"] as const,
};

const segment = encodeURIComponent;

// --- Public profiles (IAM) ----------------------------------------------------

export function getProfileByUsername(username: string, signal?: AbortSignal) {
  return apiRequest(`/api/users/by-username/${segment(username)}`, {
    schema: publicProfileSchema, operation: "getProfileByUsername", signal,
  });
}

export function getProfileByAccount(accountId: string, signal?: AbortSignal) {
  return apiRequest(`/api/users/by-subject/${segment(accountId)}`, {
    schema: publicProfileSchema, operation: "getProfileByAccount", signal,
  });
}

export function searchPeople(query: string, size = 50, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: query, size: String(size) });
  return apiRequest(`/api/users/search?${params}`, {
    schema: pageSchema(publicProfileSchema), operation: "searchPeople", signal,
  });
}

/** Avatar and banner URLs through the authenticated proxy, versioned so a replaced image is refetched. */
export function avatarUrl(profile: { id: string; avatarMediaId: string | null }) {
  return profile.avatarMediaId ? `/api/users/${segment(profile.id)}/picture?v=${segment(profile.avatarMediaId)}` : null;
}

export function bannerUrl(profile: { id: string; bannerMediaId: string | null }) {
  return profile.bannerMediaId ? `/api/users/${segment(profile.id)}/banner?v=${segment(profile.bannerMediaId)}` : null;
}

export function profilePath(username: string) {
  return `/u/${segment(username)}`;
}

// --- Following and blocking (Community) ---------------------------------------

const userPath = (accountId: string) => `/api/social/users/${segment(accountId)}`;

export function getSocialSummary(accountId: string, signal?: AbortSignal) {
  return apiRequest(`${userPath(accountId)}/summary`, { schema: socialSummarySchema, operation: "getSocialSummary", signal });
}

export function followUser(accountId: string) {
  return apiRequest(`${userPath(accountId)}/follow`, { method: "PUT", schema: socialSummarySchema, operation: "followUser" });
}

export function unfollowUser(accountId: string) {
  return apiRequest(`${userPath(accountId)}/follow`, { method: "DELETE", operation: "unfollowUser" });
}

export function setFollowAlerts(accountId: string, alerts: boolean) {
  return apiRequest(`${userPath(accountId)}/alerts`, {
    method: "PUT", body: { alerts }, schema: socialSummarySchema, operation: "setFollowAlerts",
  });
}

export function blockUser(accountId: string) {
  return apiRequest(`${userPath(accountId)}/block`, { method: "PUT", schema: socialSummarySchema, operation: "blockUser" });
}

export function unblockUser(accountId: string) {
  return apiRequest(`${userPath(accountId)}/block`, { method: "DELETE", operation: "unblockUser" });
}

export function listConnections(
  accountId: string,
  kind: "followers" | "following",
  page: number,
  within?: string[],
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (within) params.set("within", within.join(","));
  return apiRequest(`${userPath(accountId)}/${kind}?${params}`, {
    schema: pageSchema(connectionSchema), operation: `list-${kind}`, signal,
  });
}

const profilePostSchema = z.unknown().transform((row, context) => {
  const post = postSchema.safeParse(row);
  if (!post.success) {
    context.addIssue({ code: "custom", message: "Invalid post" });
    return z.NEVER;
  }
  const pinned = z.object({ pinnedOnProfile: z.boolean() }).safeParse(row);
  return { post: post.data, pinned: pinned.success && pinned.data.pinnedOnProfile };
});
export type ProfilePost = { post: CommunityPost; pinned: boolean };

export function listProfilePosts(accountId: string, page: number, signal?: AbortSignal) {
  return apiRequest(`${userPath(accountId)}/posts?page=${page}&size=10`, {
    schema: pageSchema(profilePostSchema), operation: "listProfilePosts", signal,
  });
}

export function listProfilePlans(accountId: string, page: number, signal?: AbortSignal) {
  return apiRequest(`/api/shared-plans/by-author/${segment(accountId)}?page=${page}&size=12`, {
    schema: pageSchema(profilePlanSchema), operation: "listProfilePlans", signal,
  });
}

export function setPostPinned(postId: string, pinned: boolean) {
  return apiRequest(`/api/posts/${segment(postId)}/pin`, { method: pinned ? "PUT" : "DELETE", operation: "setPostPinned" });
}

export function setPlanPinned(token: string, pinned: boolean) {
  return apiRequest(`/api/shared-plans/${segment(token)}/pin`, { method: pinned ? "PUT" : "DELETE", operation: "setPlanPinned" });
}

/** The account behind a named Explore listing; 404 for anonymous or link-only plans. */
export function getPlanAuthor(token: string, signal?: AbortSignal) {
  return apiRequest(`/api/shared-plans/${segment(token)}/author`, {
    schema: z.object({ accountId: z.string() }), operation: "getPlanAuthor", signal,
  });
}

export function listBlocked(page: number, signal?: AbortSignal) {
  return apiRequest(`/api/social/blocks?page=${page}&size=20`, {
    schema: pageSchema(blockedUserSchema), operation: "listBlocked", signal,
  });
}

export function getSocialSettings(signal?: AbortSignal) {
  return apiRequest("/api/social/settings", { schema: socialSettingsSchema, operation: "getSocialSettings", signal });
}

export function updateSocialSettings(connectionsVisibility: ConnectionsVisibility) {
  return apiRequest("/api/social/settings", {
    method: "PUT", body: { connectionsVisibility }, schema: socialSettingsSchema, operation: "updateSocialSettings",
  });
}

export function reportContent(input: { targetType: ReportTargetType; targetId: string; reason: ReportReason; details: string }) {
  return apiRequest("/api/reports", {
    method: "POST",
    body: { ...input, details: input.details.trim() || null },
    schema: z.object({ id: z.string() }),
    operation: "reportContent",
  });
}

// --- Notifications (Community) --------------------------------------------------

export function listNotifications(unreadOnly: boolean, page: number, size = 20, signal?: AbortSignal) {
  return apiRequest(`/api/notifications?unread=${unreadOnly}&page=${page}&size=${size}`, {
    schema: pageSchema(notificationSchema), operation: "listNotifications", signal,
  });
}

export function getUnreadCount(signal?: AbortSignal) {
  return apiRequest("/api/notifications/unread-count", { schema: unreadCountSchema, operation: "getUnreadCount", signal });
}

export function markNotificationRead(id: string) {
  return apiRequest(`/api/notifications/${segment(id)}/read`, { method: "POST", schema: unreadCountSchema, operation: "markNotificationRead" });
}

export function markAllNotificationsRead() {
  return apiRequest("/api/notifications/read-all", { method: "POST", schema: unreadCountSchema, operation: "markAllNotificationsRead" });
}

export function getNotificationPreferences(signal?: AbortSignal) {
  return apiRequest("/api/notifications/preferences", {
    schema: notificationPreferencesSchema, operation: "getNotificationPreferences", signal,
  });
}

export function updateNotificationPreferences(preferences: NotificationPreferences) {
  return apiRequest("/api/notifications/preferences", {
    method: "PUT", body: preferences, schema: notificationPreferencesSchema, operation: "updateNotificationPreferences",
  });
}
