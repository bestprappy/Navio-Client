"use client";

import Link from "next/link";
import { FileText, Map as MapIcon, UserPlus } from "lucide-react";

import { formatRelativeTime } from "@/app/feature/community/_components/data";
import { explorePlanPath } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { useResolvedAuthor } from "@/components/social/profile-link";
import { UserAvatar } from "@/components/social/user-avatar";
import { profilePath } from "@/lib/social-api";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/validations/social";

/** Where a notification leads, or null when its subject is gone. */
export function notificationHref(item: NotificationItem, actorUsername: string | null): string | null {
  if (!item.available) return null;
  switch (item.type) {
    case "new_follower":
      return actorUsername ? profilePath(actorUsername) : null;
    case "followed_post":
      return item.postId && item.groupSlug ? `/community/${encodeURIComponent(item.groupSlug)}/${encodeURIComponent(item.postId)}` : null;
    case "followed_plan":
      return item.planToken ? explorePlanPath(item.planToken) : null;
  }
}

const ICONS = { new_follower: UserPlus, followed_post: FileText, followed_plan: MapIcon } as const;

type NotificationRowProps = {
  item: NotificationItem;
  compact?: boolean;
  onOpen: (item: NotificationItem) => void;
};

/** One notification: who, what, when, and an unread mark that is text as well as colour. */
export function NotificationRow({ item, compact = false, onOpen }: NotificationRowProps) {
  const actor = useResolvedAuthor(item.actorId);
  const href = notificationHref(item, actor.username);
  const Icon = ICONS[item.type];

  const message = (() => {
    switch (item.type) {
      case "new_follower":
        return <><strong className="font-semibold">{actor.name}</strong> started following you</>;
      case "followed_post":
        return item.available
          ? <><strong className="font-semibold">{actor.name}</strong> posted <span className="text-foreground">“{item.postTitle}”</span></>
          : <><strong className="font-semibold">{actor.name}</strong> posted something that is no longer available</>;
      case "followed_plan":
        return item.available
          ? <><strong className="font-semibold">{actor.name}</strong> shared a plan{item.planTitle ? <>: <span className="text-foreground">{item.planTitle}</span></> : null}</>
          : <><strong className="font-semibold">{actor.name}</strong> shared a plan that is no longer shared</>;
    }
  })();

  const body = (
    <>
      <span className="relative shrink-0">
        <UserAvatar name={actor.name} src={actor.avatarUrl} size={compact ? "default" : "lg"} />
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <Icon aria-hidden="true" className="size-3 text-muted-foreground" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm text-muted-foreground">{message}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
      </span>
      {item.read ? null : (
        <span className="mt-1.5 flex shrink-0 items-center gap-1">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
          <span className="sr-only">Unread</span>
        </span>
      )}
    </>
  );

  const className = cn(
    "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    item.read ? "" : "bg-primary/5",
    href ? "hover:bg-muted/70" : "cursor-default",
  );

  return href ? (
    <Link href={href} className={className} onClick={() => onOpen(item)}>{body}</Link>
  ) : (
    <button type="button" className={className} onClick={() => onOpen(item)}>{body}</button>
  );
}
