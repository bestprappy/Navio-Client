"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useViewer } from "@/hooks/use-social";
import { listNotifications, markAllNotificationsRead, markNotificationRead, notificationKeys } from "@/lib/social-api";
import type { NotificationItem } from "@/lib/validations/social";

/** Paged notifications plus read actions that keep the list and the bell count in step. */
export function useNotifications(unreadOnly: boolean, pageSize = 20) {
  const viewer = useViewer();
  const client = useQueryClient();

  const list = useInfiniteQuery({
    queryKey: [...notificationKeys.list(unreadOnly), pageSize],
    queryFn: ({ pageParam, signal }) => listNotifications(unreadOnly, pageParam, pageSize, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    enabled: viewer.signedIn,
    staleTime: 15_000,
  });

  const refresh = async (unreadCount: number) => {
    client.setQueryData(notificationKeys.unread, { unreadCount });
    await client.invalidateQueries({ queryKey: ["notifications", "list"] });
  };

  const markRead = useMutation({
    mutationFn: (item: NotificationItem) => markNotificationRead(item.id),
    onSuccess: (result) => refresh(result.unreadCount),
    onError: (error) => console.error("Marking a notification read failed.", { component: "useNotifications", error }),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (result) => refresh(result.unreadCount),
    onError: (error) => console.error("Marking all notifications read failed.", { component: "useNotifications", error }),
  });

  const open = (item: NotificationItem) => {
    if (!item.read) markRead.mutate(item);
  };

  return { list, items: list.data?.pages.flatMap((page) => page.content) ?? [], open, markAll };
}
