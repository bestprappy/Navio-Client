"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CommunityReportCard } from "./community-report-card";
import { ReportQueueList } from "./report-queue-list";
import { listCommunityReports, liveQueryOptions, reportKeys, type CommunityStatus } from "./reports-api";

const STATUSES: { id: CommunityStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
];

/**
 * Reported profiles, posts and community comments. Open reports oldest first;
 * each can be dismissed, or actioned with the reported post or comment removed.
 * Accounts are suspended from Users, which owns account state.
 */
export function CommunityReportQueue() {
  const [status, setStatus] = useState<CommunityStatus>("open");
  const reports = useInfiniteQuery({
    queryKey: reportKeys.community(status),
    queryFn: ({ pageParam, signal }) => listCommunityReports(status, pageParam, 20, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    ...liveQueryOptions,
  });
  const rows = reports.data?.pages.flatMap((page) => page.content) ?? [];
  const total = reports.data?.pages[0]?.totalElements ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={status} onValueChange={(value) => setStatus(value as CommunityStatus)}>
        <TabsList aria-label="Report status">
          {STATUSES.map((option) => (
            <TabsTrigger key={option.id} value={option.id} className="px-4">{option.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <ReportQueueList
        isPending={reports.isPending}
        error={reports.error}
        onRetry={() => void reports.refetch()}
        isEmpty={rows.length === 0}
        emptyMessage={status === "open" ? "No reported profiles, posts or comments are waiting for review." : `No ${status} reports yet.`}
        summary={`${total} ${status} ${total === 1 ? "report" : "reports"}`}
        hasMore={reports.hasNextPage}
        loadingMore={reports.isFetchingNextPage}
        onLoadMore={() => void reports.fetchNextPage()}
      >
        {rows.map((report) => <CommunityReportCard key={report.id} report={report} />)}
      </ReportQueueList>
    </div>
  );
}
