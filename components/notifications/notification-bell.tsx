"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";
import { useUnreadCount, useViewer } from "@/hooks/use-social";
import { NotificationRow } from "./notification-item";

/**
 * The navbar bell: unread count, the latest few notifications, mark all read,
 * and a link to the full list. The count refreshes every minute while the tab
 * is visible.
 */
export function NotificationBell() {
  const viewer = useViewer();
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount();
  const { list, items, open: openItem, markAll } = useNotifications(false, 6);
  if (!viewer.signedIn) return null;

  const count = unread.data?.unreadCount ?? 0;
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications";

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) void list.refetch(); }}>
      <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-sm" className="relative" aria-label={label} />}>
        <Bell aria-hidden="true" />
        {count > 0 ? (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold leading-none text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {count > 0 ? (
            <Button type="button" variant="ghost" className="h-8 px-2 text-xs" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
              <CheckCheck aria-hidden="true" />
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto p-1.5">
          {list.isPending ? (
            <div className="flex flex-col gap-2 p-2">{[0, 1, 2].map((row) => <Skeleton key={row} className="h-12 w-full" />)}</div>
          ) : list.isError ? (
            <p role="alert" className="p-4 text-sm text-muted-foreground">Notifications couldn&apos;t load. Try again in a moment.</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nothing yet. Follow travellers to hear when they post or share a plan.
            </p>
          ) : (
            <ul role="list" className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationRow item={item} compact onOpen={(target) => { openItem(target); setOpen(false); }} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border p-1.5">
          <Link href="/notifications" onClick={() => setOpen(false)}
            className="flex min-h-10 items-center justify-center rounded-md text-sm font-medium text-primary hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            See all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
