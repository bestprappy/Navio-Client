"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ReportQueueListProps = {
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyMessage: string;
  /** "3 open reports", shown above the list once it has rows. */
  summary: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  children: ReactNode;
};

/** Loading, error, empty and "Show more" states shared by every moderation queue. */
export function ReportQueueList({
  isPending, error, onRetry, isEmpty, emptyMessage, summary, hasMore, loadingMore, onLoadMore, children,
}: ReportQueueListProps) {
  return (
    <div aria-busy={isPending} className="flex flex-col gap-3">
      {isPending ? (
        [0, 1, 2].map((row) => <Skeleton key={row} className="h-36 w-full" />)
      ) : error && isEmpty ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          {error.message}
          <Button type="button" variant="outline" onClick={onRetry}>Try again</Button>
        </div>
      ) : isEmpty ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{summary}</p>
          <ul role="list" className="flex flex-col gap-3">{children}</ul>
        </>
      )}
      {hasMore ? (
        <Button type="button" variant="outline" className="w-fit" disabled={loadingMore} onClick={onLoadMore}>
          Show more
        </Button>
      ) : null}
    </div>
  );
}
