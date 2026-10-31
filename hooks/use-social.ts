"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { ApiError } from "@/lib/api-client";
import {
  blockUser,
  followUser,
  getProfileByAccount,
  getSocialSummary,
  getUnreadCount,
  notificationKeys,
  setFollowAlerts,
  socialKeys,
  unblockUser,
  unfollowUser,
} from "@/lib/social-api";
import type { SocialSummary } from "@/lib/validations/social";

/** The signed-in state every social query depends on. */
export function useViewer() {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user && !session.error;
  return { signedIn, loading: status === "loading", accountId: session?.user?.id ?? null };
}

/**
 * A traveller's public profile by account id (the id posts and comments carry).
 * Cached for five minutes and shared by every author label on the page.
 */
export function useAccountProfile(accountId: string | null | undefined) {
  const { signedIn } = useViewer();
  return useQuery({
    queryKey: socialKeys.profileByAccount(accountId ?? "none"),
    queryFn: ({ signal }) => getProfileByAccount(accountId as string, signal),
    enabled: signedIn && !!accountId,
    staleTime: 5 * 60_000,
    retry: (count, error) => !(error instanceof ApiError && (error.status === 404 || error.status === 410)) && count < 1,
  });
}

export function useSocialSummary(accountId: string | null | undefined) {
  const { signedIn } = useViewer();
  return useQuery({
    queryKey: socialKeys.summary(accountId ?? "none"),
    queryFn: ({ signal }) => getSocialSummary(accountId as string, signal),
    enabled: signedIn && !!accountId,
    staleTime: 30_000,
  });
}

function patchSummary(client: QueryClient, accountId: string, patch: (summary: SocialSummary) => SocialSummary) {
  const key = socialKeys.summary(accountId);
  const previous = client.getQueryData<SocialSummary>(key);
  if (previous) client.setQueryData(key, patch(previous));
  return previous;
}

/**
 * Follow, unfollow, alerts and blocking for one account. Follow changes are
 * applied optimistically so every button showing this account agrees at once,
 * then reconciled with the server's counts; a failure rolls back.
 */
export function useRelationshipActions(accountId: string) {
  const client = useQueryClient();
  const key = socialKeys.summary(accountId);

  const settle = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: key }),
      client.invalidateQueries({ queryKey: ["social", "connections"] }),
    ]);
  };

  const follow = useMutation({
    mutationKey: ["social", "follow", accountId],
    mutationFn: async (next: boolean) => {
      if (next) return followUser(accountId);
      await unfollowUser(accountId);
      return null;
    },
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: key });
      const previous = patchSummary(client, accountId, (summary) => ({
        ...summary,
        viewerFollows: next,
        viewerNotify: next,
        followerCount: Math.max(0, summary.followerCount + (next === summary.viewerFollows ? 0 : next ? 1 : -1)),
      }));
      return { previous };
    },
    onError: (error, _next, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
      console.error("Follow change failed.", { component: "useRelationshipActions", accountId, error });
    },
    onSuccess: (summary) => {
      if (summary) client.setQueryData(key, summary);
    },
    onSettled: settle,
  });

  const alerts = useMutation({
    mutationFn: (next: boolean) => setFollowAlerts(accountId, next),
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: key });
      return { previous: patchSummary(client, accountId, (summary) => ({ ...summary, viewerNotify: next })) };
    },
    onError: (error, _next, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
      console.error("Alert change failed.", { component: "useRelationshipActions", accountId, error });
    },
    onSuccess: (summary) => client.setQueryData(key, summary),
    onSettled: settle,
  });

  const block = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) return blockUser(accountId);
      await unblockUser(accountId);
      return null;
    },
    onSuccess: (summary) => {
      if (summary) client.setQueryData(key, summary);
    },
    onError: (error) => console.error("Block change failed.", { component: "useRelationshipActions", accountId, error }),
    onSettled: async () => {
      await Promise.all([
        settle(),
        client.invalidateQueries({ queryKey: socialKeys.blocked }),
        client.invalidateQueries({ queryKey: socialKeys.posts(accountId) }),
        client.invalidateQueries({ queryKey: notificationKeys.all }),
        client.invalidateQueries({ queryKey: ["community"] }),
      ]);
    },
  });

  return { follow, alerts, block };
}

/** Polled unread count for the navbar bell. Pauses while the tab is hidden. */
export function useUnreadCount() {
  const { signedIn } = useViewer();
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: ({ signal }) => getUnreadCount(signal),
    enabled: signedIn,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}
