import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { ExplorePage } from "../feature/explore/_components/explore-page";
import { fetchExplorePlansFromGateway } from "../feature/explore/_components/shared-plans/explore-plans-server";

export const metadata: Metadata = {
  title: "Explore plans - Navio",
  description:
    "Explore real trip plans shared by Navio travelers.",
};

/** Rendered per request: a plan its owner just unlisted must not linger in a cached page. */
export const dynamic = "force-dynamic";

export default async function ExploreRoute() {
  // The first page arrives with the route so shared plans paint with the rest of
  // the page. A failure here is not fatal: the section retries in the browser.
  const [sharedPlans, trendingPlans] = await Promise.all([
    fetchExplorePlansFromGateway(),
    fetchExplorePlansFromGateway(0, 3, "trending"),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <ExplorePage
          initialSharedPlans={sharedPlans.status === "ok" ? sharedPlans.page : null}
          initialTrendingPlans={trendingPlans.status === "ok" ? trendingPlans.page : null}
        />
      </main>
    </>
  );
}
