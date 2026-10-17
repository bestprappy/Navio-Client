"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPinOff, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExplorePlansError,
  explorePlanSummaryQueryKey,
  fetchExplorePlanSummary,
  isShareToken,
} from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { SharedPlanCard } from "@/app/feature/explore/_components/shared-plans/shared-plan-card";

/** Loads one listed plan's card; null data means the owner no longer lists it. */
export function useAttachedPlan(token: string | null | undefined) {
  const validToken = isShareToken(token) ? token : null;
  return useQuery({
    queryKey: explorePlanSummaryQueryKey(validToken ?? ""),
    queryFn: ({ signal }) => fetchExplorePlanSummary(validToken ?? "", signal),
    enabled: validToken !== null,
    staleTime: 60_000,
    retry: (count, error) =>
      count < 2 && !(error instanceof ExplorePlansError && error.status >= 400 && error.status < 500),
  });
}

/**
 * The Explore plan a post discusses. Older posts may carry ids from before plans
 * were real; those render nothing rather than a broken card.
 */
export function CommunityPlanAttachment({ token }: { token: string | null | undefined }) {
  const plan = useAttachedPlan(token);

  if (!isShareToken(token)) return null;

  if (plan.isPending) {
    return (
      <div role="status" className="flex gap-3 rounded-2xl border border-border/60 p-3">
        <span className="sr-only">Loading the attached plan</span>
        <Skeleton className="h-20 w-28 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2 py-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  if (plan.isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
        <span className="min-w-0 flex-1">The attached plan could not be loaded.</span>
        <Button type="button" variant="outline" size="sm" onClick={() => void plan.refetch()}>
          <RotateCw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  if (!plan.data) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
        <MapPinOff className="size-4 shrink-0" aria-hidden="true" />
        This plan is no longer listed on Explore.
      </p>
    );
  }

  return <SharedPlanCard plan={plan.data} layout="row" />;
}
