"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlacesDiscovery } from "../places/places-discovery";
import { placesEnabled } from "../places/places-config";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuideDiscovery } from "../../guides/guide-discovery";

import { ExploreErrorBoundary } from "./explore-error-boundary";
import { explorePlanSearchText, type ExplorePlansPage } from "./shared-plans/explore-plans-api";
import { SharedPlanCard } from "./shared-plans/shared-plan-card";
import { SharedPlansSection } from "./shared-plans/shared-plans-section";
import { useExplorePlans } from "./shared-plans/use-explore-plans";

type ExplorePageProps = {
  initialTab?: "plans" | "guides" | "places";
  initialSearch?: string;
  initialSharedPlans: ExplorePlansPage | null;
  initialTrendingPlans: ExplorePlansPage | null;
};

export function ExplorePage({ initialSharedPlans, initialTrendingPlans, initialTab = "plans", initialSearch = "" }: ExplorePageProps) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab = tabParam === "guides" ? "guides" : tabParam === "places" && placesEnabled ? "places" : initialTab === "places" && !placesEnabled ? "plans" : tabParam === "plans" ? "plans" : initialTab;
  const recent = useExplorePlans(initialSharedPlans, "recent", undefined, tab === "plans");
  const trending = useExplorePlans(initialTrendingPlans, "trending", undefined, tab === "plans");
  const [searches, setSearches] = useState({ plans: initialTab === "plans" ? initialSearch : "", guides: initialTab === "guides" ? initialSearch : "" });
  const search = tab === "guides" ? searches.guides : searches.plans;
  const deferredSearch = useDeferredValue(search.trim());
  const query = deferredSearch.toLowerCase();
  const matchingRecent = useMemo(
    () => query ? recent.plans.filter((plan) => explorePlanSearchText(plan).includes(query)) : recent.plans,
    [query, recent.plans],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
      <Tabs value={tab} onValueChange={value => { const next = new URLSearchParams(params); next.set("tab", String(value)); next.delete("term"); next.delete("collection"); router.push(`/explore?${next}`, { scroll: false }); }} className="gap-7">
        <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <TabsList variant="line" aria-label="Explore content" className="h-12 gap-6">
            <TabsTrigger value="plans" className="px-2">Plans</TabsTrigger>
            <TabsTrigger value="guides" className="px-2">Guides</TabsTrigger>
            {placesEnabled && <TabsTrigger value="places" className="px-2">Places</TabsTrigger>}
          </TabsList>
        </div>
        <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{tab === "plans" ? "Find your next itinerary" : tab === "guides" ? "Get to know a destination" : "Find somewhere worth going"}</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">{tab === "plans" ? "Explore shared trips and find ideas for your own route." : tab === "guides" ? "Discover places and practical tips shared by travelers." : "Discover seasonal picks, scenic spots, and places that suit your trip."}</p>
        {tab !== "places" &&
        <label className="relative block max-w-xl">
          <span className="sr-only">Search by city, country or title</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            maxLength={100}
            onChange={(event) => setSearches(previous => ({ ...previous, [tab]: event.target.value }))}
            placeholder={tab === "guides" ? "Search guides by city, country or title" : "Search shared plans by city, country or title"}
            className="h-11 rounded-lg bg-card pl-10"
          />
        </label>}
      </header>
        {placesEnabled && <TabsContent value="places"><ExploreErrorBoundary fallbackTitle="Places unavailable"><PlacesDiscovery /></ExploreErrorBoundary></TabsContent>}
        <TabsContent value="guides"><ExploreErrorBoundary fallbackTitle="Guides unavailable"><GuideDiscovery filter={{ term: deferredSearch }} /></ExploreErrorBoundary></TabsContent>
        <TabsContent value="plans" className="space-y-10">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
