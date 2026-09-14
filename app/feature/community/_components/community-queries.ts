"use client";

import { useMemo } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useCommunityIdentity } from "./community-group-queries";
import { getDeletedPostId, isDeletedPostQuery, listPosts, postRequest, postSchema, commentSchema } from "./community-post-api";
import { pageSchema } from "./community-api";
import type { CommunityFeedSort } from "./data";

export { useCommunityGroups } from "./community-group-queries";

export function useCommunityFeed(query: string, sort: CommunityFeedSort, group?: string) {
  const { identity, ready } = useCommunityIdentity();
  const result = useInfiniteQuery({
    queryKey: ["community", identity, "posts", query, sort, group ?? "all"],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => listPosts(query, sort, pageParam, group, signal),
    getNextPageParam: (page) => page.last ? undefined : page.number + 1,
    enabled: ready, retry: false,
  });
  const data = useMemo(() => [...new Map(result.data?.pages.flatMap((page) => page.content).map((post) => [post.id, post]) ?? []).values()], [result.data]);
  return { ...result, data };
}

export function useCommunityPost(id: string) {
  const { identity, ready } = useCommunityIdentity();
  return useQuery({
    queryKey: ["community", identity, "post", id],
    queryFn: ({ signal }) => postRequest(`/${encodeURIComponent(id)}`, postSchema, undefined, signal),
    enabled: ready, retry: false,
  });
}

export function useCommunityComments(postId: string) {
  const { identity, ready } = useCommunityIdentity();
  const result = useInfiniteQuery({
    queryKey: ["community", identity, "comments", postId],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => postRequest(`/${postId}/comments?page=${pageParam}&size=50`, pageSchema(commentSchema), undefined, signal),
    getNextPageParam: (page) => page.last ? undefined : page.number + 1,
    enabled: ready, retry: false,
  });
  return { ...result, comments: result.data?.pages.flatMap((page) => page.content) ?? [] };
}

export function usePostMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method, body }: { path: string; method: string; body?: unknown }) =>
      postRequest(path, method === "DELETE" ? z.null() : z.union([postSchema, commentSchema]), { method, body }),
    onSuccess: (_data, variables) => {
      const deletedPostId = getDeletedPostId(variables);
      return client.invalidateQueries({
        queryKey: ["community"],
        // Refresh feeds so a deleted post drops out, but never refetch the deleted post itself:
        // the detail page navigates away and would otherwise flash a not-found error.
        predicate: (query) => !isDeletedPostQuery(query.queryKey, deletedPostId),
      });
    },
  });
}
