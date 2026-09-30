"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ExploreErrorBoundary } from "./explore-error-boundary";
import { explorePlanSearchText, type ExplorePlansPage } from "./shared-plans/explore-plans-api";
import { SharedPlanCard } from "./shared-plans/shared-plan-card";
import { SharedPlansSection } from "./shared-plans/shared-plans-section";
import { useExplorePlans } from "./shared-plans/use-explore-plans";

type ExplorePageProps = {
  initialSharedPlans: ExplorePlansPage | null;
  initialTrendingPlans: ExplorePlansPage | null;
};

export function ExplorePage({ initialSharedPlans, initialTrendingPlans }: ExplorePageProps) {
  const recent = useExplorePlans(initialSharedPlans, "recent");
  const trending = useExplorePlans(initialTrendingPlans, "trending");
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const matchingRecent = useMemo(
    () => query ? recent.plans.filter((plan) => explorePlanSearchText(plan).includes(query)) : recent.plans,
    [query, recent.plans],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Explore plans</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          See trips travelers shared from their own planners. Open a plan to explore its days, then copy it to make it yours.
        </p>
        <label className="relative block max-w-xl">
          <span className="sr-only">Search shared plans</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search destinations, plans, or travelers"
            className="h-11 rounded-lg bg-card pl-10"
          />
        </label>
      </header>

      {!query && trending.plans.length > 0 && (
        <ExploreErrorBoundary fallbackTitle="Trending plans unavailable">
          <section aria-labelledby="trending-plans-title" className="space-y-4">
            <div>
              <h2 id="trending-plans-title" className="text-xl font-semibold text-foreground">Trending plans</h2>
              <p className="text-sm text-muted-foreground">Shared plans travelers are opening most.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trending.plans.slice(0, 3).map((plan) => <SharedPlanCard key={plan.token} plan={plan} />)}
            </div>
          </section>
        </ExploreErrorBoundary>
      )}

      <ExploreErrorBoundary fallbackTitle="Recent plans unavailable">
        <SharedPlansSection
          plans={matchingRecent}
          total={query ? matchingRecent.length : recent.total}
          isLoading={recent.isLoading}
          isError={recent.isError}
          isFetchingMore={recent.isFetchingMore}
          hasMore={recent.hasMore}
          loadMoreFailed={recent.loadMoreFailed}
          onLoadMore={() => void recent.fetchMore()}
          onRetry={() => void recent.refetch()}
          query={query}
        />
      </ExploreErrorBoundary>

      {query && recent.hasMore && matchingRecent.length === 0 && !recent.isFetchingMore && (
        <p className="text-sm text-muted-foreground">Search covers plans loaded so far. Load more to keep searching.</p>
      )}
      {trending.isError && !recent.isError && !query && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => void trending.refetch()}>
          Refresh trending plans
        </Button>
      )}
    </div>
  );
}
