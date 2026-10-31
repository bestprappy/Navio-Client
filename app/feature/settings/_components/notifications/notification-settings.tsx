"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";

import { AuthorChip } from "@/components/social/profile-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewer } from "@/hooks/use-social";
import {
  getNotificationPreferences,
  listConnections,
  notificationKeys,
  setFollowAlerts,
  socialKeys,
  updateNotificationPreferences,
} from "@/lib/social-api";
import type { Connection, NotificationPreferences, Page } from "@/lib/validations/social";
import { SettingSwitch } from "../setting-switch";
import { SettingsGroup, SettingsHeader } from "../settings-section";

const TYPES: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "newFollower", label: "New followers", description: "When someone starts following you." },
  { key: "followedPost", label: "Posts from people you follow", description: "Only for people whose alerts are on below." },
  { key: "followedPlan", label: "Plans shared by people you follow", description: "When they list a plan on Explore under their name." },
];

/** Settings > Notifications: in-app notification types and per-person alerts. */
export function NotificationSettings() {
  const viewer = useViewer();
  const client = useQueryClient();

  const preferences = useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: ({ signal }) => getNotificationPreferences(signal),
    enabled: viewer.signedIn,
  });

  const update = useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: notificationKeys.preferences });
      const previous = client.getQueryData<NotificationPreferences>(notificationKeys.preferences);
      client.setQueryData(notificationKeys.preferences, next);
      return { previous };
    },
    onError: (error, _next, context) => {
      if (context?.previous) client.setQueryData(notificationKeys.preferences, context.previous);
      console.error("Notification preferences failed to save.", { component: "NotificationSettings", error });
    },
    onSuccess: (saved) => client.setQueryData(notificationKeys.preferences, saved),
  });

  return (
    <main className="flex flex-col">
      <SettingsHeader title="Notifications" description="Choose what appears in your Navio notifications. Email and push notifications aren't available yet." />
      <div className="divide-y divide-border">
        <SettingsGroup title="Notify me about" description="Changes save as soon as you switch them.">
          {preferences.isPending ? (
            <div className="flex flex-col gap-3">{TYPES.map((type) => <Skeleton key={type.key} className="h-10 w-full" />)}</div>
          ) : !preferences.data ? (
            <div role="alert" className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
              {preferences.error?.message ?? "Your notification settings couldn't load."}
              <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void preferences.refetch()}>Try again</Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {TYPES.map((type) => (
                <SettingSwitch
                  key={type.key}
                  label={type.label}
                  description={type.description}
                  checked={preferences.data[type.key]}
                  disabled={update.isPending}
                  onCheckedChange={(checked) => update.mutate({ ...preferences.data, [type.key]: checked })}
                />
              ))}
              {update.isError ? <p role="alert" className="pt-2 text-sm text-destructive">{update.error.message}</p> : null}
            </div>
          )}
        </SettingsGroup>

        <SettingsGroup title="Alerts for people you follow"
          description="Following someone doesn't mean hearing about everything. Turn alerts on for the people whose new posts and plans you want to know about.">
          {viewer.accountId ? <FollowingAlerts accountId={viewer.accountId} /> : null}
        </SettingsGroup>
      </div>
    </main>
  );
}

type ConnectionPages = InfiniteData<Page<Connection>, number>;

function FollowingAlerts({ accountId }: { accountId: string }) {
  const client = useQueryClient();
  const key = socialKeys.connections(accountId, "following", "");
  const following = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => listConnections(accountId, "following", pageParam, undefined, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });

  const toggle = useMutation({
    mutationFn: ({ target, alerts }: { target: string; alerts: boolean }) => setFollowAlerts(target, alerts),
    onMutate: async ({ target, alerts }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<ConnectionPages>(key);
      client.setQueryData<ConnectionPages>(key, (data) => data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          content: page.content.map((row) => (row.accountId === target ? { ...row, viewerAlerts: alerts } : row)),
        })),
      });
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
      console.error("Alert change failed.", { component: "FollowingAlerts", error });
    },
    onSettled: (_data, _error, { target }) => client.invalidateQueries({ queryKey: socialKeys.summary(target) }),
  });

  if (following.isPending) return <div className="flex flex-col gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;
  if (following.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
        {following.error.message}
        <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void following.refetch()}>Try again</Button>
      </div>
    );
  }
  const rows = following.data.pages.flatMap((page) => page.content);
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">You aren&apos;t following anyone yet. Follow travellers from their profiles or community posts.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul role="list" className="flex flex-col divide-y divide-border/60">
        {rows.map((row) => (
          <li key={row.accountId} className="flex items-center justify-between gap-3 py-2">
            <AuthorChip accountId={row.accountId} size="default" />
            <Button
              type="button"
              variant={row.viewerAlerts ? "secondary" : "ghost"}
              className="h-9 shrink-0 px-3"
              aria-pressed={row.viewerAlerts}
              onClick={() => toggle.mutate({ target: row.accountId, alerts: !row.viewerAlerts })}
            >
              {row.viewerAlerts ? <Bell aria-hidden="true" className="text-primary" /> : <BellOff aria-hidden="true" />}
              {row.viewerAlerts ? "Alerts on" : "Alerts off"}
            </Button>
          </li>
        ))}
      </ul>
      {toggle.isError ? <p role="alert" className="text-sm text-destructive">{toggle.error.message}</p> : null}
      {following.hasNextPage ? (
        <Button type="button" variant="outline" className="h-10 w-fit px-4" disabled={following.isFetchingNextPage} onClick={() => void following.fetchNextPage()}>
          {following.isFetchingNextPage ? "Loading…" : "Show more"}
        </Button>
      ) : null}
    </div>
  );
}
