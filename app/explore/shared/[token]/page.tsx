import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { SharedPlanContent } from "@/app/feature/planner/_components/share/shared-plan-content";
import { SharedPlanHeader } from "@/app/feature/planner/_components/share/shared-plan-header";
import { fetchSharedPlan } from "@/app/feature/planner/_components/share/shared-plan-request";

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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
          <BackToExplore />

          {result.status === "error" ? (
            <Unavailable
              title="This plan could not be loaded"
              message="Navio could not reach the plan just now. Try again in a moment."
            />
          ) : result.status === "unavailable" || !result.plan.listedInExplore ? (
            // Unlisted, stopped and never-existed read the same, for the same
            // reason as the link page: the difference would confirm a plan exists.
            <Unavailable
              title="This plan is no longer on Explore"
              message="Its owner may have removed it from Explore or stopped sharing it."
            />
          ) : (
            <article className="mt-6">
              <SharedPlanHeader
                plan={result.plan.plan}
                publishedAt={result.plan.publishedAt}
                authorName={result.plan.authorName}
              />
              <div className="py-6">
                <SharedPlanContent plan={result.plan.plan} />
              </div>
              <footer className="space-y-3 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  This is a read-only copy. Changes the owner makes later stay private until they
                  update it.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button render={<Link href="/dashboard" />} size="sm">
                    Plan your own trip
                  </Button>
                  <Button render={<Link href="/explore" />} variant="outline" size="sm">
                    Browse more plans
                  </Button>
                </div>
              </footer>
            </article>
          )}
        </div>
      </main>
    </>
  );
}
