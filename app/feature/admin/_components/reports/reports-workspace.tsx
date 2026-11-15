"use client";

import { useState } from "react";
import { useIsFetching, useQueries, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { CommentReportQueue } from "./comment-report-queue";
import { CommunityReportQueue } from "./community-report-queue";
import { countOpenReports, LIVE_REFRESH_MS, liveQueryOptions, reportKeys, type ReportSource } from "./reports-api";

const SOURCES: { id: ReportSource; label: string }[] = [
  { id: "community", label: "Profiles & posts" },
  { id: "plan", label: "Shared Plan comments" },
  { id: "guide", label: "Guide comments" },
];

/**
 * The platform moderation queue. Reports live with the content they are about:
 * profiles, posts and community comments in Community; comments on Shared
 * Plans in Trip; comments on Guides in user management. Each has a tab with
 * its open count, and every queue refreshes on its own while the page is open.
 */
export function ReportsWorkspace() {
  const client = useQueryClient();
  const [source, setSource] = useState<ReportSource>("community");
  const counts = useQueries({
    queries: SOURCES.map((option) => ({
      queryKey: reportKeys.count(option.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => countOpenReports(option.id, signal),
      ...liveQueryOptions,
    })),
  });
  const refreshing = useIsFetching({ queryKey: reportKeys.all }) > 0;
  const waiting = counts.reduce((sum, count) => sum + (count.data ?? 0), 0);
  const anyCounted = counts.some((count) => count.data !== undefined);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {anyCounted ? (waiting === 0 ? "Nothing is waiting for review." : `${waiting} waiting for review across all queues.`) : "Checking for reports…"}
          <span className="ml-1">Updates every {LIVE_REFRESH_MS / 1000} seconds.</span>
        </p>
        <Button type="button" variant="outline" size="sm" disabled={refreshing}
          onClick={() => void client.invalidateQueries({ queryKey: reportKeys.all })}>
          <RefreshCw aria-hidden="true" className={cn(refreshing && "animate-spin motion-reduce:animate-none")} />
          Refresh
        </Button>
      </div>

      <Tabs value={source} onValueChange={(value) => setSource(value as ReportSource)} className="gap-4">
        <TabsList aria-label="Report queue" className="h-auto w-full flex-wrap justify-start sm:w-fit">
          {SOURCES.map((option, index) => {
            const open = counts[index]?.data;
            return (
              <TabsTrigger key={option.id} value={option.id} className="h-9 flex-none px-3">
                {option.label}
                {open ? (
                  <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
                    {open}<span className="sr-only"> open</span>
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value="community"><CommunityReportQueue /></TabsContent>
        <TabsContent value="plan"><CommentReportQueue source="plan" /></TabsContent>
        <TabsContent value="guide"><CommentReportQueue source="guide" /></TabsContent>
      </Tabs>
    </div>
  );
}
