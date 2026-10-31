"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, Settings2 } from "lucide-react";

import { NotificationRow } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";
import { useUnreadCount, useViewer } from "@/hooks/use-social";
import { cn } from "@/lib/utils";

/** The full notification list at /notifications. */
export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unread = useUnreadCount();
  const { list, items, open, markAll } = useNotifications(unreadOnly);
  const count = unread.data?.unreadCount ?? 0;
  const viewer = useViewer();

  if (!viewer.loading && !viewer.signedIn) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Your session has expired</h1>
        <p className="text-sm text-muted-foreground">Sign in again to see your notifications.</p>
        <Link href="/sign-in?callbackUrl=%2Fnotifications" className={cn(buttonVariants(), "h-10 px-5")}>Sign in again</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">{count > 0 ? `${count} unread` : "You're all caught up."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-10 px-4" disabled={count === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck aria-hidden="true" />
            Mark all read
          </Button>
          <Link href="/settings/notifications" className={cn(buttonVariants({ variant: "ghost" }), "h-10 px-3")}>
            <Settings2 aria-hidden="true" />
            Settings
          </Link>
        </div>
      </header>

      <div role="tablist" aria-label="Filter notifications" className="mt-4 flex w-fit gap-1 rounded-lg bg-muted p-1">
        {[{ value: false, label: "All" }, { value: true, label: "Unread" }].map((option) => (
          <button
            key={option.label}
            type="button"
            role="tab"
            aria-selected={unreadOnly === option.value}
            onClick={() => setUnreadOnly(option.value)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              unreadOnly === option.value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-busy={list.isPending} className="mt-4">
        {list.isPending ? (
          <div className="flex flex-col gap-2">{[0, 1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-16 w-full" />)}</div>
        ) : list.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-[var(--card-radius-md)] border border-border bg-card p-5 text-sm text-muted-foreground">
            {list.error.message}
            <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void list.refetch()}>Try again</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[var(--card-radius-md)] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {unreadOnly ? "No unread notifications." : (
              <>Nothing here yet. Follow travellers from their profiles or <Link href="/community" className="font-medium text-primary underline underline-offset-4">Community</Link> to hear when they post or share a plan.</>
            )}
          </div>
        ) : (
          <ul role="list" className="flex flex-col gap-1 rounded-[var(--card-radius-md)] border border-border bg-card p-1.5">
            {items.map((item) => <li key={item.id}><NotificationRow item={item} onOpen={open} /></li>)}
          </ul>
        )}
        {list.hasNextPage ? (
          <Button type="button" variant="outline" className="mt-4 h-10 px-4" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading…" : "Show older"}
          </Button>
        ) : null}
        {markAll.isError ? <p role="alert" className="mt-3 text-sm text-destructive">{markAll.error.message}</p> : null}
      </section>
    </main>
  );
}
