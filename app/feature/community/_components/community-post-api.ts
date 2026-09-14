import { z } from "zod";
import { communityRequest, pageSchema } from "./community-api";
import type { CommunityPost, CommunityComment } from "./data";

const optionalText = z.string().nullable().transform((value) => value ?? undefined);
export const postSchema = z.object({
  id: z.string().uuid(), groupId: z.string().uuid(), groupSlug: z.string().min(1),
  groupName: z.string(), authorId: z.string().uuid(), title: z.string(), body: z.string(),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(), upvotes: z.number().int(),
  commentCount: z.number().int().nonnegative(), viewerVote: z.number().int().min(-1).max(1),
  flairId: z.string().uuid().nullable().transform((value) => value ?? undefined),
  sharedTripId: optionalText,
  linkUrl: z.string().regex(/^https?:\/\/[^\s]+$/).nullable().transform((value) => value ?? undefined),
  imageUrl: z.string().regex(/^\/v1\/posts\/[0-9a-f-]+\/image$/).nullable().transform((value) => value?.replace(/^\/v1\//, "/api/") ?? undefined),
}).transform((post): CommunityPost => ({ ...post, tags: [], place: "", country: "" }));

export const commentSchema = z.object({
  id: z.string().uuid(), postId: z.string().uuid(), authorId: z.string().uuid(),
  parentCommentId: z.string().uuid().nullable().transform((value) => value ?? undefined),
  body: z.string(), deleted: z.boolean(), edited: z.boolean(), createdAt: z.string().datetime(),
  upvotes: z.number().int(), viewerVote: z.number().int().min(-1).max(1),
}).transform((comment): CommunityComment => comment);

export const postFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(300),
  body: z.string().trim().max(40000),
  linkUrl: z.union([z.literal(""), z.string().trim().url().max(2048).regex(/^https?:\/\//, "Use an HTTP or HTTPS link.")]),
});
export type PostFormValues = z.infer<typeof postFormSchema>;

export function postRequest<T>(path: string, schema: z.ZodType<T>, init?: { method: string; body?: unknown }, signal?: AbortSignal) {
  return communityRequest(path, schema, init, signal, "posts");
}

/** The id of the post a mutation removes, or null when it edits, votes or touches a comment. */
export function getDeletedPostId({ path, method }: { path: string; method: string }) {
  const segments = path.split("/").filter(Boolean);
  return method === "DELETE" && segments.length === 1 ? segments[0] : null;
}

/** Queries that would 404 if refetched after their post was deleted. */
export function isDeletedPostQuery(queryKey: readonly unknown[], deletedPostId: string | null) {
  return deletedPostId !== null && (queryKey[2] === "post" || queryKey[2] === "comments") && queryKey[3] === deletedPostId;
}

export function listPosts(query: string, sort: string, page: number, group?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: query.trim().slice(0, 200), sort, page: String(page), size: "20" });
  if (group) params.set("group", group);
  return postRequest(`?${params}`, pageSchema(postSchema), undefined, signal);
}

export function createPost(groupSlug: string, values: PostFormValues, flairId: string | null, sharedTripId: string | null, file: File | null, requestId?: string) {
  const valid = postFormSchema.parse(values);
  const body = { ...valid, groupSlug, linkUrl: valid.linkUrl || null, flairId, sharedTripId, requestId };
  if (!file) return postRequest("", postSchema, { method: "POST", body });
  const multipart = new FormData();
  multipart.append("post", new Blob([JSON.stringify(body)], { type: "application/json" }));
  multipart.append("file", file);
  return postRequest("", postSchema, { method: "POST", body: multipart });
}
