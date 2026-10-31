"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { ExternalLink, FileText, Map as MapIcon, UserPlus, X } from "lucide-react";

import { notificationHref } from "@/components/notifications/notification-item";
import {
  dismissNotificationToastAtom,
  notificationToastsAtom,
  type NotificationToast,
} from "@/components/notifications/notification-toasts.atoms";
import { useResolvedAuthor } from "@/components/social/profile-link";
import { UserAvatar } from "@/components/social/user-avatar";
import { Button } from "@/components/ui/button";
import { opensInNewTab, TOAST_LIFETIME_MS, toastActionLabel, visibleToasts } from "@/lib/notifications/live-notifications";
import { markNotificationRead, notificationKeys } from "@/lib/social-api";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/validations/social";

/**
 * Each kind keeps the accent family it has across the profile: people in green,
 * shared plans in violet, posts in the brand blue. The colour is paired with an
 * icon, and the card itself stays a neutral surface for readable text.
 */
const KIND = {
  new_follower: { Icon: UserPlus, edge: "before:bg-charging", badge: "bg-charging text-background" },
  followed_plan: { Icon: MapIcon, edge: "before:bg-premade", badge: "bg-premade text-background" },
  followed_post: { Icon: FileText, edge: "before:bg-primary", badge: "bg-primary text-primary-foreground" },
} as const;

/**
 * Toasts for notifications that arrived while the app is open. A polite live
 * region announces them without moving focus; nothing navigates unless the
 * person chooses View. On the planner, View opens a new tab so unsaved work and
 * the current selection stay put.
 */
export function NotificationToaster() {
  const toasts = useAtomValue(notificationToastsAtom);
  const { shown, hidden } = visibleToasts(toasts);

  return (
    <section
      aria-label="New notifications"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-88"
    >
      <ol aria-live="polite" aria-relevant="additions" className="flex w-full flex-col gap-2">
        {shown.map((toast) => (
          <ToastCard key={toast.item.id} toast={toast} />
        ))}
      </ol>
      {hidden > 0 ? (
        <Link
          href="/notifications"
          className="pointer-events-auto rounded-full bg-popover px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-md ring-1 ring-border transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {hidden} more new {hidden === 1 ? "notification" : "notifications"}
        </Link>
      ) : null}
    </section>
  );
}

function ToastCard({ toast }: { toast: NotificationToast }) {
  const { item } = toast;
  const dismiss = useSetAtom(dismissNotificationToastAtom);
  const client = useQueryClient();
  const pathname = usePathname();
  const actor = useResolvedAuthor(item.actorId);
  const href = notificationHref(item, actor.username);
  const kind = KIND[item.type];
  const newTab = opensInNewTab(pathname);
  const close = useCallback(() => dismiss(item.id), [dismiss, item.id]);
  const paused = usePausableTimer(close, TOAST_LIFETIME_MS);

  const open = () => {
    close();
    // Opening counts as reading; seeing the toast alone does not.
    void markNotificationRead(item.id)
      .then((result) => {
        client.setQueryData(notificationKeys.unread, { unreadCount: result.unreadCount });
        return client.invalidateQueries({ queryKey: ["notifications", "list"] });
      })
      .catch((error: unknown) => console.warn("Marking a notification read from a toast failed.", { component: "NotificationToaster", error }));
  };

  const action = href ? (
    newTab ? (
      <a href={href} target="_blank" rel="noopener" onClick={open} className={actionClass}>
        {toastActionLabel(item.type)}
        <ExternalLink aria-hidden="true" className="size-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    ) : (
      <Link href={href} onClick={open} className={actionClass}>
        {toastActionLabel(item.type)}
      </Link>
    )
  ) : null;

  return (
    <li
      {...paused}
      className={cn(
        "pointer-events-auto relative flex w-full gap-3 overflow-hidden rounded-xl bg-popover py-3 pr-2 pl-4 text-popover-foreground shadow-lg ring-1 ring-border",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200",
        kind.edge,
      )}
    >
      <span className="relative flex shrink-0 self-start">
        <UserAvatar name={actor.name} src={actor.avatarUrl} size="default" />
        <span className={cn("absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2 ring-popover", kind.badge)}>
          <kind.Icon aria-hidden="true" className="size-3" />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          <ToastMessage item={item} actorName={actor.name} />
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Just now</span>
          {action}
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Dismiss notification" className="-mt-1 shrink-0 text-muted-foreground">
        <X aria-hidden="true" />
      </Button>
    </li>
  );
}

const actionClass =
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function ToastMessage({ item, actorName }: { item: NotificationItem; actorName: string }) {
  const name = <strong className="font-semibold text-foreground">{actorName}</strong>;
  switch (item.type) {
    case "new_follower":
      return <>{name} started following you</>;
    case "followed_post":
      return <>{name} posted {item.postTitle ? <span className="text-foreground">“{item.postTitle}”</span> : "something new"}</>;
    case "followed_plan":
      return <>{name} shared a plan{item.planTitle ? <>: <span className="text-foreground">{item.planTitle}</span></> : null}</>;
  }
}

/**
 * Calls {@code onExpire} after {@code lifetime}, paused while the pointer is over
 * the toast or focus is inside it, so nobody loses a toast they are reading or
 * reaching with the keyboard. Resuming restarts the full lifetime.
 */
function usePausableTimer(onExpire: () => void, lifetime: number) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expire = useRef(onExpire);
  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (hovered || focused) return;
    const timer = setTimeout(() => expire.current(), lifetime);
    return () => clearTimeout(timer);
  }, [hovered, focused, lifetime]);

  return {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (event: React.FocusEvent<HTMLLIElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    },
  };
}
