"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { CommentReportCard } from "./comment-report-card";
import { ReportQueueList } from "./report-queue-list";
import { listCommentReports, liveQueryOptions, reportKeys } from "./reports-api";

const EMPTY_COPY = {
  plan: "No reported Shared Plan comments are waiting for review.",
  guide: "No reported Guide comments are waiting for review.",
} as const;

/** Reported comments on Shared Plans or Guides, oldest report first, refreshed live. */
export function CommentReportQueue({ source }: { source: "plan" | "guide" }) {
  const reports = useInfiniteQuery({
    queryKey: reportKeys.comments(source),
    queryFn: ({ pageParam, signal }) => listCommentReports(source, pageParam, 20, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    ...liveQueryOptions,
  });
  const rows = reports.data?.pages.flatMap((page) => page.content) ?? [];
  const total = reports.data?.pages[0]?.totalElements ?? 0;

  return (
    <ReportQueueList
      isPending={reports.isPending}
      error={reports.error}
      onRetry={() => void reports.refetch()}
      isEmpty={rows.length === 0}
      emptyMessage={EMPTY_COPY[source]}
      summary={`${total} reported ${total === 1 ? "comment" : "comments"} waiting for review`}
      hasMore={reports.hasNextPage}
      loadingMore={reports.isFetchingNextPage}
      onLoadMore={() => void reports.fetchNextPage()}
    >
      {rows.map((report) => <CommentReportCard key={report.commentId} source={source} report={report} />)}
    </ReportQueueList>
  );
}
