"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  useInfiniteQuery,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CommunityApiError,
  communityRequest,
  createGroupSchema,
  groupDetailSchema,
  listGroups,
  membershipSchema,
  splitCommunityTerms,
  toCommunityGroup,
  type CreateGroupValues,
  type GroupDetail,
} from "./community-api";
import type { CommunityGroup } from "./data";

const EMPTY_GROUPS: CommunityGroup[] = [];

export function useCommunityIdentity() {
  const { data: session, status } = useSession();
  return {
    identity: !session?.error
      ? (session?.user?.id ?? "anonymous")
      : "anonymous",
    ready: status !== "loading",
    authenticated: status === "authenticated" && !session?.error,
  };
}

export function useCommunityGroups(query = "", mine = false) {
  const { identity, ready, authenticated } = useCommunityIdentity();
  const result = useInfiniteQuery({
    queryKey: [
      "community",
      identity,
      "groups",
      mine ? "mine" : "discover",
      query.trim(),
    ],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      listGroups(query, pageParam, signal, mine),
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled: ready && (!mine || authenticated),
    staleTime: 30_000,
    retry: (count, error) =>
      count < 1 &&
      !(
        error instanceof CommunityApiError &&
        error.status >= 400 &&
        error.status < 500
      ),
  });
  const groups = useMemo(
    () =>
      result.data
        ? [
            ...new Map(
              result.data.pages
                .flatMap((page) => page.content)
                .map((group) => [group.id, toCommunityGroup(group)]),
            ).values(),
          ]
        : EMPTY_GROUPS,
    [result.data],
  );
  return {
    ...result,
    data: groups,
    total: result.data?.pages[0]?.totalElements ?? 0,
    isLoading: !ready || result.isLoading,
  };
}

export function useCommunityGroup(slug?: string) {
  const { identity, ready } = useCommunityIdentity();
  return useQuery({
    queryKey: ["community", identity, "group", slug],
    queryFn: ({ signal }) =>
      communityRequest(
        `/${encodeURIComponent(slug!)}`,
        groupDetailSchema,
        undefined,
        signal,
      ),
    enabled: ready && Boolean(slug),
    staleTime: 30_000,
    retry: (count, error) =>
      count < 1 &&
      !(
        error instanceof CommunityApiError &&
        error.status >= 400 &&
        error.status < 500
      ),
  });
}

export function useGroupMembership() {
  const client = useQueryClient();
  const { identity } = useCommunityIdentity();
  const mutationKey = ["community", identity, "membership"];
  const pending = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: ({
      group,
      action,
    }: {
      group: CommunityGroup;
      action: "join" | "leave" | "mute" | "unmute";
    }) => {
      if (!group.slug)
        throw new Error(
          "This community is unavailable. Refresh and try again.",
        );
      return communityRequest(
        `/${encodeURIComponent(group.slug)}/members/me`,
        membershipSchema,
        {
          method:
            action === "join"
              ? "POST"
              : action === "leave"
                ? "DELETE"
                : "PATCH",
          ...(action === "mute" || action === "unmute"
            ? { body: { muted: action === "mute" } }
            : {}),
        },
      );
    },
    onSuccess: async (membership, { group }) => {
      client.setQueryData<GroupDetail>(
        ["community", identity, "group", group.slug],
        (previous) =>
          previous
            ? {
                ...previous,
                joined: membership.joined,
                muted: membership.muted,
                role: membership.role,
                memberCount: membership.memberCount,
              }
            : previous,
      );
      await client.invalidateQueries({ queryKey: ["community", identity] });
    },
  });
  return { ...mutation, isPending: pending || mutation.isPending };
}

export function useCreateCommunityGroup() {
  const client = useQueryClient();
  const { identity } = useCommunityIdentity();
  return useMutation({
    mutationFn: (values: CreateGroupValues) => {
      const parsed = createGroupSchema.parse(values);
      return communityRequest("", groupDetailSchema, {
        method: "POST",
        body: {
          ...parsed,
          country: parsed.country || null,
          places: splitCommunityTerms(parsed.places),
          tags: splitCommunityTerms(parsed.tags),
        },
      });
    },
    onSuccess: async (group) => {
      client.setQueryData(["community", identity, "group", group.slug], group);
      await client.invalidateQueries({ queryKey: ["community", identity] });
    },
  });
}

export function useUpdateCommunityGroup(slug: string) {
  const client = useQueryClient();
  const { identity } = useCommunityIdentity();
  return useMutation({
    mutationKey: ["community", "settings", slug],
    scope: { id: `community-settings-${slug}` },
    mutationFn: ({
      section,
      body,
    }: {
      section: "profile" | "rules" | "flairs" | "resources" | "moderators";
      body: unknown;
    }) =>
      communityRequest(
        `/${encodeURIComponent(slug)}/${section}`,
        groupDetailSchema,
        { method: section === "profile" ? "PATCH" : "PUT", body },
      ),
    onSuccess: async (group) => {
      client.setQueryData(["community", identity, "group", slug], group);
      await client.invalidateQueries({ queryKey: ["community", identity] });
    },
  });
}
