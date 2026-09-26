"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AdminApiError,
  fetchAdminStatistics,
  fetchAdminUser,
  fetchAdminUserSample,
  fetchModerationEvents,
  moderateUser,
  searchAdminUsers,
  type AdminUserSearch,
  type ModerationAction,
  type UserStatus,
} from "./admin-api";

/** Everything under this key is admin data; one invalidation refreshes it all. */
const ADMIN_ROOT = ["admin", "users"] as const;

export const adminQueryKeys = {
  root: ADMIN_ROOT,
  statistics: () => [...ADMIN_ROOT, "statistics"] as const,
  search: (search: AdminUserSearch) => [...ADMIN_ROOT, "search", search] as const,
  sample: (status: UserStatus | null, size: number) => [...ADMIN_ROOT, "sample", status, size] as const,
  detail: (userId: string) => [...ADMIN_ROOT, "detail", userId] as const,
  events: (userId: string, page: number) => [...ADMIN_ROOT, "events", userId, page] as const,
};

/** Admin data is shared state other staff change; keep it short-lived. */
const ADMIN_STALE_MS = 15_000;

/** Auth and "not found" failures will not fix themselves on retry. */
function retryTransient(failureCount: number, error: Error): boolean {
  if (error instanceof AdminApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function useAdminStatistics() {
  return useQuery({
    queryKey: adminQueryKeys.statistics(),
    queryFn: fetchAdminStatistics,
    staleTime: ADMIN_STALE_MS,
    retry: retryTransient,
  });
}

export function useAdminUserSearch(search: AdminUserSearch) {
  return useQuery({
    queryKey: adminQueryKeys.search(search),
    queryFn: () => searchAdminUsers(search),
    staleTime: ADMIN_STALE_MS,
    // Keep the old rows visible while the next page or filter loads.
    placeholderData: keepPreviousData,
    retry: retryTransient,
  });
}

export function useAdminUserSample(status: UserStatus | null, size: number) {
  return useQuery({
    queryKey: adminQueryKeys.sample(status, size),
    queryFn: () => fetchAdminUserSample(status, size),
    staleTime: ADMIN_STALE_MS,
    retry: retryTransient,
  });
}

export function useAdminUser(userId: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.detail(userId ?? ""),
    queryFn: () => fetchAdminUser(userId!),
    enabled: Boolean(userId),
    staleTime: 0,
    retry: retryTransient,
  });
}

export function useModerationEvents(userId: string | null, page = 0) {
  return useQuery({
    queryKey: adminQueryKeys.events(userId ?? "", page),
    queryFn: () => fetchModerationEvents(userId!, page),
    enabled: Boolean(userId),
    staleTime: 0,
    retry: retryTransient,
  });
}

export function useModerateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, action, reason }: { userId: string; action: ModerationAction; reason: string }) =>
      moderateUser(userId, action, reason),
    // Never retried: a ban that timed out may still have been applied, and a
    // blind retry would answer "already banned" and confuse the moderator.
    retry: false,
    // Refetch after success *and* failure. A 409 means someone else acted
    // first, so the row, counts and history on screen are stale either way.
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.root }),
  });
}
