import { z } from "zod";

import { explorePlanSchema } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";

/**
 * Client mirrors of the public profile, social graph, notification and report
 * contracts. Responses are validated so a changed payload surfaces as an error
 * state instead of an undefined read deep in the tree.
 */

const nullableString = z.string().nullish().transform((value) => value ?? null);

/** `PublicUserProfileResponse`: what any signed-in traveller may see. */
export const publicProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  avatarMediaId: nullableString,
  memberSince: nullableString,
  username: nullableString,
  accountId: nullableString,
  bio: nullableString,
  bannerMediaId: nullableString,
  travelInterests: z.array(z.string()).nullish().transform((value) => value ?? []),
  travelPace: nullableString,
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;

/** Spring Data page envelope; malformed rows are dropped rather than failing the page. */
export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    content: z.array(z.unknown()).transform((rows) =>
      rows.flatMap((row) => {
        const parsed = item.safeParse(row);
        return parsed.success ? [parsed.data as z.output<T>] : [];
      }),
    ),
    totalElements: z.number().int().nonnegative().catch(0),
    number: z.number().int().nonnegative().catch(0),
    last: z.boolean().catch(true),
  });
}
export type Page<T> = { content: T[]; totalElements: number; number: number; last: boolean };

export const socialSummarySchema = z.object({
  accountId: z.string(),
  followerCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
  connectionsVisibility: z.enum(["everyone", "followers", "only_me"]).catch("everyone"),
  canViewConnections: z.boolean(),
  viewerFollows: z.boolean(),
  followsViewer: z.boolean(),
  viewerNotify: z.boolean(),
  viewerBlocked: z.boolean(),
  blockedViewer: z.boolean(),
  self: z.boolean(),
});
export type SocialSummary = z.infer<typeof socialSummarySchema>;

export const connectionSchema = z.object({
  accountId: z.string(),
  since: z.string(),
  viewerFollows: z.boolean(),
  viewerAlerts: z.boolean().catch(false),
});
export type Connection = z.infer<typeof connectionSchema>;

export const blockedUserSchema = z.object({ accountId: z.string(), blockedAt: z.string() });
export type BlockedUser = z.infer<typeof blockedUserSchema>;

export const connectionsVisibilitySchema = z.enum(["everyone", "followers", "only_me"]);
export type ConnectionsVisibility = z.infer<typeof connectionsVisibilitySchema>;
export const socialSettingsSchema = z.object({ connectionsVisibility: connectionsVisibilitySchema });

export const notificationTypeSchema = z.enum(["new_follower", "followed_post", "followed_plan"]);
export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  actorId: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
  postId: nullableString,
  postTitle: nullableString,
  groupSlug: nullableString,
  planToken: nullableString,
  planTitle: nullableString,
  available: z.boolean(),
});
export type NotificationItem = z.infer<typeof notificationSchema>;
export const unreadCountSchema = z.object({ unreadCount: z.number().int().nonnegative() });
export const notificationPreferencesSchema = z.object({
  newFollower: z.boolean(),
  followedPost: z.boolean(),
  followedPlan: z.boolean(),
});
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const reportReasonSchema = z.enum([
  "spam", "harassment", "hate", "inappropriate", "impersonation", "misinformation", "other",
]);
export type ReportReason = z.infer<typeof reportReasonSchema>;
export type ReportTargetType = "user" | "post" | "comment";

export const reportSchema = z.object({
  id: z.string(),
  targetType: z.enum(["user", "post", "comment"]),
  targetId: z.string(),
  targetUserId: nullableString,
  reason: reportReasonSchema.catch("other"),
  details: nullableString,
  status: z.enum(["open", "actioned", "dismissed"]),
  reporterId: z.string(),
  resolutionNote: nullableString,
  resolvedBy: nullableString,
  resolvedAt: nullableString,
  createdAt: z.string(),
  targetPreview: nullableString,
  targetAvailable: z.boolean(),
});
export type Report = z.infer<typeof reportSchema>;

export const profilePlanSchema = z.object({ plan: explorePlanSchema, pinned: z.boolean() });
export type ProfilePlan = z.infer<typeof profilePlanSchema>;

export const securityOverviewSchema = z.object({
  passwordSet: z.boolean(),
  linkedProviders: z.array(z.string()).catch([]),
  emailVerified: z.boolean(),
  authenticatedAt: nullableString,
  available: z.boolean(),
});
export type SecurityOverview = z.infer<typeof securityOverviewSchema>;

export const usernameAvailabilitySchema = z.object({
  username: z.string(),
  available: z.boolean(),
  message: nullableString,
});
export type UsernameAvailability = z.infer<typeof usernameAvailabilitySchema>;
