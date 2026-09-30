import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Navbar } from "@/components/navbar";
import SidebarWrapper from "@/components/sidebar/sidebar";
import { Button } from "@/components/ui/button";
import { fetchSharedPlan } from "@/app/feature/planner/_components/share/shared-plan-request";
import { SharedPlannerView } from "@/app/feature/planner/_components/share/shared-planner-view";

export const dynamic = "force-dynamic";

/** One upstream read per request, shared by the metadata and the page. */
const loadSharedPlan = cache(fetchSharedPlan);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const result = await loadSharedPlan(token);

  // The owner listed this plan publicly, so its title may name the tab. Anything
  // not currently listed falls back to the generic title, like the link page.
  const title =
    result.status === "ok" && result.plan.listedInExplore && result.plan.plan.title
      ? `${result.plan.plan.title} - Explore - Navio`
      : "Shared plan - Explore - Navio";
  return {
    title,
    description: "A trip plan shared on Navio Explore.",
    robots: { index: false, follow: false, nocache: true },
  };
}

function BackToExplore() {
  return (
    <Link
      href="/explore"
      className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to Explore
    </Link>
  );
}

function Unavailable({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-12">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button render={<Link href="/explore" />} variant="outline">
        Browse other plans
      </Button>
    </div>
  );
}

/**
 * A listed plan, read inside Explore.
 *
 * <p>Same snapshot and renderer as the shared-link page, framed by Explore's
 * navigation so moving between the feed and a plan feels like one place. Serves
 * only plans that are listed right now: once the owner unlists, this page stops
 * showing the plan even to someone who kept the URL from the feed.
 */
export default async function ExploreSharedPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await loadSharedPlan(token);

  if (result.status === "ok" && result.plan.listedInExplore) {
    // The planner's own frame: app sidebar, itinerary drawer and map.
    return (
      <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
        <SidebarWrapper />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <SharedPlannerView
            shared={result.plan}
            token={token}
            backLink={{ href: "/explore", label: "Back to Explore" }}
          />
        </main>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
          <BackToExplore />

          {result.status === "error" ? (
            <Unavailable
              title="This plan could not be loaded"
              message="Navio could not reach the plan just now. Try again in a moment."
            />
          ) : (
            // Unlisted, stopped and never-existed read the same, for the same
            // reason as the link page: the difference would confirm a plan exists.
            <Unavailable
              title="This plan is no longer on Explore"
              message="Its owner may have removed it from Explore or stopped sharing it."
            />
          )}
        </div>
      </main>
    </>
  );
}
