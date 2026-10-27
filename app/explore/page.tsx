import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { placesEnabled } from "../feature/explore/places/places-config";
import { ExplorePage } from "../feature/explore/_components/explore-page";
import { fetchExplorePlansFromGateway } from "../feature/explore/_components/shared-plans/explore-plans-server";

import { TRENDING_PAGE_SIZE } from "../feature/explore/_components/shared-plans/explore-plans-api";

export const metadata: Metadata = {
  title: "Explore plans, guides and places - Navio",
  description:
    "Explore trip plans and destination guides shared by Navio travelers.",
};

/** Rendered per request: a plan its owner just unlisted must not linger in a cached page. */
export const dynamic = "force-dynamic";

export default async function ExploreRoute({ searchParams }: { searchParams: Promise<{ tab?: string; term?: string }> }) {
  const search = await searchParams;
  // The first page arrives with the route so shared plans paint with the rest of
  // the page. A failure here is not fatal: the section retries in the browser.
  const [sharedPlans, trendingPlans] = await Promise.all([
    search.tab === "guides" || search.tab === "places" ? null : fetchExplorePlansFromGateway(),
    search.tab === "guides" || search.tab === "places" ? null : fetchExplorePlansFromGateway(0, TRENDING_PAGE_SIZE, "trending"),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <ExplorePage
          initialTab={search.tab === "guides" ? "guides" : search.tab === "places" && placesEnabled ? "places" : "plans"}
          initialSearch={search.term?.slice(0, 100) ?? ""}
          initialSharedPlans={sharedPlans?.status === "ok" ? sharedPlans.page : null}
          initialTrendingPlans={trendingPlans?.status === "ok" ? trendingPlans.page : null}
        />
      </main>
    </>
  );
}
