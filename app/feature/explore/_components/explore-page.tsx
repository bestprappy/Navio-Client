"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PlacesDiscovery } from "../places/places-discovery";
import { placesEnabled } from "../places/places-config";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuidesExplorer } from "../../guides/discovery/guides-explorer";

import { ExploreErrorBoundary } from "./explore-error-boundary";
import { type ExplorePlansPage } from "./shared-plans/explore-plans-api";
import { SharedPlanSearch } from "./shared-plans/search/shared-plan-search";

type ExplorePageProps = {
  initialTab?: "plans" | "guides" | "places";
  initialSearch?: string;
  initialSharedPlans: ExplorePlansPage | null;
  initialTrendingPlans: ExplorePlansPage | null;
};

export function ExplorePage({ initialSharedPlans, initialTrendingPlans, initialTab = "plans" }: ExplorePageProps) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab = tabParam === "guides" ? "guides" : tabParam === "places" && placesEnabled ? "places" : initialTab === "places" && !placesEnabled ? "plans" : tabParam === "plans" ? "plans" : initialTab;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
      <Tabs value={tab} onValueChange={value => { const next = new URLSearchParams(params); next.set("tab", String(value)); router.push(`/explore?${next}`, { scroll: false }); }} className="gap-7">
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
      </header>
        {placesEnabled && <TabsContent value="places"><ExploreErrorBoundary fallbackTitle="Places unavailable"><PlacesDiscovery /></ExploreErrorBoundary></TabsContent>}
        <TabsContent value="guides"><ExploreErrorBoundary fallbackTitle="Guides unavailable"><GuidesExplorer /></ExploreErrorBoundary></TabsContent>
        <TabsContent value="plans"><SharedPlanSearch knownPlans={[...(initialTrendingPlans?.content??[]),...(initialSharedPlans?.content??[])]}/></TabsContent>
      </Tabs>
    </div>
  );
}
