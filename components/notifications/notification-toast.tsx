"use client";

import { usePathname } from "next/navigation";
import { FileText, Map as MapIcon, UserPlus } from "lucide-react";

import { useResolvedAuthor } from "@/components/social/profile-link";
import { UserAvatar } from "@/components/social/user-avatar";
import { notify } from "@/components/toast/notify";
import { ToastCard } from "@/components/toast/toast-card";
import { useMarkNotificationRead } from "@/hooks/use-notifications";
import { arrivalsAreSummarised, notificationToastCopy, opensInNewTab } from "@/lib/notifications/live-notifications";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/validations/social";
import { notificationHref } from "./notification-item";

const SUMMARY_TOAST_ID = "notification-summary";

/** People in green, shared plans in violet, posts in the brand blue, each paired with an icon. */
const KIND = {
  new_follower: { Icon: UserPlus, badge: "bg-charging text-background" },
  followed_plan: { Icon: MapIcon, badge: "bg-premade text-background" },
  followed_post: { Icon: FileText, badge: "bg-primary text-primary-foreground" },
} as const;

function NotificationToast({ item, onDismiss }: { item: NotificationItem; onDismiss: () => void }) {
  const actor = useResolvedAuthor(item.actorId);
  const markRead = useMarkNotificationRead();
  const pathname = usePathname();
  const { title, description } = notificationToastCopy(item, actor.name);
  const kind = KIND[item.type];

  return (
    <ToastCard
      tone="notification"
      media={
        <span className="relative flex shrink-0">
          <UserAvatar name={actor.name} src={actor.avatarUrl} />
          <span className={cn("absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full ring-2 ring-popover", kind.badge)}>
            <kind.Icon aria-hidden="true" className="size-2.5" />
          </span>
        </span>
      }
      title={title}
      description={description}
      href={notificationHref(item, actor.username)}
      newTab={opensInNewTab(pathname)}
      // Opening counts as reading; seeing the toast alone does not.
      onOpen={() => markRead.mutate(item)}
      onDismiss={onDismiss}
    />
  );
}

/** Shows notifications that just arrived and returns the toast ids, so they can be cleared on sign-out. */
export function showNotificationToasts(arrivals: readonly NotificationItem[]): string[] {
  if (arrivals.length === 0) return [];
  if (arrivalsAreSummarised(arrivals.length)) {
    notify.notification({
      id: SUMMARY_TOAST_ID,
      title: `${arrivals.length} new notifications`,
      href: "/notifications",
      newTab: opensInNewTab(window.location.pathname),
    });
    return [SUMMARY_TOAST_ID];
  }
  // Arrivals come newest first; show the oldest first so the newest lands on top.
  [...arrivals].reverse().forEach((item) => {
    notify.render((dismiss) => <NotificationToast item={item} onDismiss={dismiss} />, { id: item.id });
  });
  return arrivals.map((item) => item.id);
}
