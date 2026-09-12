import { z } from "zod";

import type { CommunityGroup } from "./data";

export const flairToneSchema = z.enum([
  "reliable",
  "question",
  "unsourced",
  "speculation",
  "itinerary",
  "food",
  "ev",
]);
const roleSchema = z.enum(["member", "moderator", "admin"]).nullable();
export const ruleInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1),
});
export const flairInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  tone: flairToneSchema,
  flairType: z.enum(["post", "user"]),
});
export const resourceInputSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z
    .string()
    .regex(/^https?:\/\/[^\s]+$/, "Enter an HTTP or HTTPS URL.")
    .nullable(),
});
const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().min(1),
  description: z.string(),
  country: z.string().nullable(),
  places: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  isOfficial: z.boolean(),
  status: z.string(),
  memberCount: z.number().int().nonnegative(),
  postCount: z.number().int().nonnegative(),
  joined: z.boolean(),
  muted: z.boolean(),
  role: roleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const groupDetailSchema = groupSchema.extend({
  createdById: z.string().uuid(),
  bannerUrl: z.string().nullable(),
  bannerMediaId: z.string().uuid().nullable(),
  summary: z.string().nullable(),
  weeklyVisitorCount: z.number().int().nonnegative(),
  weeklyContributionCount: z.number().int().nonnegative(),
  moderatorIds: z.array(z.string().uuid()),
  rules: z.array(
    ruleInputSchema.extend({
      id: z.string().uuid(),
      displayOrder: z.number().int(),
    }),
  ),
  postFlairs: z.array(
    flairInputSchema
      .omit({ flairType: true })
      .extend({ id: z.string().uuid(), displayOrder: z.number().int() }),
  ),
  userFlairs: z.array(
    flairInputSchema
      .omit({ flairType: true })
      .extend({ id: z.string().uuid(), displayOrder: z.number().int() }),
  ),
  resources: z.array(
    resourceInputSchema.extend({
      id: z.string().uuid(),
      displayOrder: z.number().int(),
    }),
  ),
});
export const membershipSchema = z.object({
  groupId: z.string().uuid(),
  joined: z.boolean(),
  muted: z.boolean(),
  role: roleSchema,
  state: z.string(),
  memberCount: z.number().int().nonnegative(),
});
export const memberSchema = z.object({
  userId: z.string().uuid(),
  role: z.string(),
  state: z.string(),
  joinedAt: z.string(),
  updatedAt: z.string(),
});
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    number: z.number().int().nonnegative(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    last: z.boolean(),
  });
export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a community name.")
    .max(120)
    .refine(
      (name) => /[a-z0-9]/i.test(name),
      "Include at least one English letter or number.",
    )
    .refine(
      (name) =>
        !["mine", "search", "create", "discovery", "popular"].includes(
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        ),
      "Choose another name; this address is reserved.",
    ),
  description: z.string().trim().min(1, "Describe your community."),
  country: z.string().trim().max(120),
  places: z.string(),
  tags: z.string(),
});
export type CreateGroupValues = z.infer<typeof createGroupSchema>;
export type GroupDetail = z.infer<typeof groupDetailSchema>;
export type GroupListItem = z.infer<typeof groupSchema>;
export type GroupPage = z.infer<
  ReturnType<typeof pageSchema<typeof groupSchema>>
>;

export class CommunityApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function communityRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: { method: string; body?: unknown },
  signal?: AbortSignal,
  resource: "groups" | "posts" = "groups",
): Promise<T> {
  try {
    const multipart = init?.body instanceof FormData;
    const response = await fetch(`/api/${resource}${path}`, {
      method: init?.method ?? "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body !== undefined && !multipart
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: multipart ? init.body as FormData : init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const errorBody = z.object({ message: z.string() }).safeParse(body);
      const message =
        response.status === 401
          ? "Please sign in again to continue."
          : response.status >= 500
            ? "Communities are temporarily unavailable. Please try again."
            : errorBody.success
              ? errorBody.data.message
              : "We could not complete this community request.";
      throw new CommunityApiError(message, response.status);
    }
    const result = schema.safeParse(body);
    if (!result.success)
      throw new CommunityApiError(
        "We received an unexpected community response. Please try again.",
        502,
      );
    return result.data;
  } catch (error) {
    if (signal?.aborted) throw error;
    console.error("Community API request failed", {
      path,
      method: init?.method ?? "GET",
      error,
    });
    if (error instanceof CommunityApiError) throw error;
    throw new CommunityApiError(
      "We could not reach communities. Check your connection and try again.",
      0,
    );
  }
}

export function toCommunityGroup(
  group: GroupListItem | GroupDetail,
): CommunityGroup {
  const detail = "rules" in group ? group : undefined;
  return {
    ...group,
    country: group.country ?? "",
    places: group.places ?? [],
    tags: group.tags ?? [],
    avatarUrl: "",
    createdById: detail?.createdById ?? "",
    rules: detail?.rules ?? [],
    postFlairs: detail?.postFlairs ?? [],
    userFlairs: detail?.userFlairs ?? [],
    bookmarks: detail?.resources ?? [],
    profile: detail
      ? {
          groupId: group.id,
          bannerUrl: detail.bannerMediaId
            ? `/api/groups/${encodeURIComponent(group.slug)}/banner?v=${detail.bannerMediaId}`
            : detail.bannerUrl ?? "",
          summary: detail.summary ?? group.description,
          weeklyVisitorCount: detail.weeklyVisitorCount,
          weeklyContributionCount: detail.weeklyContributionCount,
          moderatorIds: detail.moderatorIds,
        }
      : undefined,
  };
}

export function listGroups(
  query: string,
  page: number,
  signal?: AbortSignal,
  mine = false,
) {
  const params = new URLSearchParams({ page: String(page), size: "24" });
  if (query.trim()) params.set("q", query.trim());
  return communityRequest(
    `${mine ? "/mine" : query.trim() ? "/search" : ""}?${params}`,
    pageSchema(groupSchema),
    undefined,
    signal,
  );
}

export function splitCommunityTerms(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ];
}
