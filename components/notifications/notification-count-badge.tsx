"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAX_DISPLAYED_COUNT = 99;

const SIZE_CLASS_NAMES = {
  default: "h-5 min-w-5 px-1 text-xs",
  sm: "h-4 min-w-4 px-1 text-[0.625rem] leading-none",
} as const;

type NotificationCountBadgeProps = {
  count: number;
  size?: keyof typeof SIZE_CLASS_NAMES;
  className?: string;
};

/** Caps what fits inside the badge; screen readers get the exact number from {@link notificationsLabel}. */
export function formatNotificationCount(count: number) {
  return count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : String(count);
}

/** Accessible name for a control that opens notifications. */
export function notificationsLabel(count: number) {
  return count > 0 ? `Notifications, ${count} unread` : "Notifications";
}

/**
 * Yellow unread count with a ping behind it. Renders nothing at zero, and is
 * hidden from assistive tech because the parent control's name carries the
 * count. The ping is dropped for people who prefer reduced motion; the badge
 * itself stays.
 */
export function NotificationCountBadge({ count, size = "default", className }: NotificationCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span aria-hidden="true" className={cn("relative inline-flex shrink-0", className)}>
      <span className="absolute inset-0 rounded-full bg-notification motion-safe:animate-notification-ping motion-reduce:hidden" />
      <Badge className={cn("relative rounded-full bg-notification font-bold text-notification-foreground tabular-nums", SIZE_CLASS_NAMES[size])}>
        {formatNotificationCount(count)}
      </Badge>
    </span>
  );
}
