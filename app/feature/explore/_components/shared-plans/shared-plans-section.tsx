"use client";

import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { ExplorePlan } from "./explore-plans-api";
import { SharedPlanCard } from "./shared-plan-card";

type SharedPlansSectionProps = {
  plans: ExplorePlan[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  loadMoreFailed: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

export const SHARED_PLANS_HEADING_ID = "explore-shared-plans";

function SharedPlansGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/** Plans travellers published and listed, newest first. */
export function SharedPlansSection({
  plans,
  total,
  isLoading,
  isError,
  isFetchingMore,
  hasMore,
  loadMoreFailed,
  onLoadMore,
  onRetry,
}: SharedPlansSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby={SHARED_PLANS_HEADING_ID}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={SHARED_PLANS_HEADING_ID} className="text-lg font-semibold text-foreground">
            Shared by travelers
          </h2>
          <p className="text-sm text-muted-foreground">
            Real trips people planned in Navio and chose to publish.
          </p>
        </div>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total} {total === 1 ? "plan" : "plans"}
          </span>
        )}
      </div>

      {isLoading ? (
        <SharedPlansGrid>
          {[0, 1, 2].map((key) => (
            <div key={key} className="space-y-3 rounded-lg border border-border bg-card p-0" aria-hidden="true">
              <Skeleton className="aspect-video w-full rounded-b-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
          <span className="sr-only" role="status">
            Loading shared plans
          </span>
        </SharedPlansGrid>
      ) : isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-4">
          <p role="alert" className="text-sm text-foreground">
            Shared plans could not be loaded. The curated plans below still work.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-5 py-6">
          <p className="text-sm font-medium text-foreground">No shared plans yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a saved trip&apos;s menu, choose Publish plan as a link, and tick List on Explore.
          </p>
          <Button render={<Link href="/dashboard" />} variant="outline" size="sm" className="mt-3">
            Go to my trips
          </Button>
        </div>
      ) : (
        <>
          <SharedPlansGrid>
            {plans.map((plan) => (
              <SharedPlanCard key={plan.token} plan={plan} />
            ))}
          </SharedPlansGrid>
          {(hasMore || loadMoreFailed) && (
            <div className="flex flex-col items-start gap-2">
              <Button type="button" variant="outline" disabled={isFetchingMore} onClick={onLoadMore}>
                {isFetchingMore && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isFetchingMore ? "Loading…" : "Show more shared plans"}
              </Button>
              {loadMoreFailed && (
                <p role="alert" className="text-sm text-destructive">
                  More plans could not be loaded. Try again.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
