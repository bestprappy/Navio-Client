"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminErrorState, AdminLoadingRows } from "./admin-query-state";
import { formatAdminDateTime } from "./admin-format";
import { moderationEventLabel } from "./admin-api";
import { useModerationEvents } from "./admin-queries";

type ModerationHistoryProps = {
  userId: string;
  headingId: string;
};

/** Bans, unbans and role changes for one account, newest first. */
export function ModerationHistory({ userId, headingId }: ModerationHistoryProps) {
  const [page, setPage] = useState(0);
  const events = useModerationEvents(userId, page);

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="sr-only">History page {page + 1}{events.isFetching ? ", loading" : ""}</p>
      {events.isPending ? <AdminLoadingRows rows={2} label="Loading account history" />
        : events.isError ? <AdminErrorState error={events.error} onRetry={() => events.refetch()} isRetrying={events.isFetching} />
        : events.data.content.length === 0 ? (
          <p className="text-sm text-muted-foreground">{page === 0 ? "No bans or role changes on this account." : "No older changes on this page."}</p>
        ) : (
    <ol aria-labelledby={headingId} className="flex flex-col">
      {events.data.content.map((event) => (
        <li key={event.id} className="flex flex-col gap-1 border-l-2 border-border py-2 pl-4">
          <p className="text-sm">
            <span className="font-semibold">{moderationEventLabel(event)}</span>
            <span className="text-muted-foreground">
              {" by "}
              {event.actorDisplayName ?? (event.actorUserId ? "a former staff member" : "Navio")}
            </span>
          </p>
          <time dateTime={event.createdAt} className="text-xs text-muted-foreground">
            {formatAdminDateTime(event.createdAt)}
          </time>
          {event.reason ? <p className="text-sm text-foreground/90">&ldquo;{event.reason}&rdquo;</p> : null}
        </li>
      ))}
    </ol>
        )}
      {page > 0 || (events.data?.totalPages ?? 0) > 1 ? (
        <nav aria-label="Account history pages" className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page === 0 || events.isFetching} onClick={() => setPage((current) => current - 1)}>
            <ChevronLeft aria-hidden="true" /> Newer
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1}{events.data ? ` of ${Math.max(events.data.totalPages, page + 1)}` : ""}</span>
          <Button variant="outline" size="sm" disabled={events.isFetching || !events.data || page + 1 >= events.data.totalPages} onClick={() => setPage((current) => current + 1)}>
            Older <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
