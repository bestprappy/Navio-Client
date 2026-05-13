"use client";

import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import { Columns2, Grid2x2, LayoutList } from "lucide-react";

import { RECENT_PLANS, TRENDING_PLANS, getPlanById, getUserById } from "./data";
import { shareDialogOpenAtom, shareDialogPlanIdAtom } from "./explore-atoms";
import { ExploreErrorBoundary } from "./explore-error-boundary";
import { PlanCardHorizontal } from "./plan-card-horizontal";
import { PlanCardVertical } from "./plan-card-vertical";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ShareDialog } from "./share-dialog";

export function ExplorePage() {
  const [shareOpen, setShareOpen] = useAtom(shareDialogOpenAtom);
  const [sharePlanId, setSharePlanId] = useAtom(shareDialogPlanIdAtom);
  const [recentView, setRecentView] = useState<1 | 2 | 4>(1);

  const sharePlan = useMemo(
    () => (sharePlanId ? (getPlanById(sharePlanId) ?? null) : null),
    [sharePlanId],
  );

  const openShare = (planId: string) => {
    setSharePlanId(planId);
    setShareOpen(true);
  };

  const closeShare = () => {
    setShareOpen(false);
    setSharePlanId(null);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-24 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-14">
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Explore trips in Thailand
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Discover trending routes and recent plans shared by the community.
          </p>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <input
              type="text"
              placeholder="Search a destination"
              aria-label="Search a destination"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </header>

        <ExploreErrorBoundary fallbackTitle="Trending plans unavailable">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Trending plans
              </h2>
              <span className="text-xs text-muted-foreground">
                Updated daily
              </span>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />
              <Carousel
                opts={{ align: "start", loop: true, skipSnaps: false }}
                className="px-12"
              >
                <CarouselContent className="-ml-6 gap-6">
                  {TRENDING_PLANS.map((plan) => (
                    <CarouselItem
                      key={plan.id}
                      className="basis-[86%] pl-6 sm:basis-1/2 lg:basis-1/3"
                    >
                      <PlanCardVertical
                        plan={plan}
                        author={getUserById(plan.authorId)!}
                        onShare={openShare}
                        variant="trending"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-2 top-[9.5rem] md:top-[10.5rem]" />
                <CarouselNext className="-right-2 top-[9.5rem] md:top-[10.5rem]" />
              </Carousel>
            </div>
          </section>
        </ExploreErrorBoundary>

        <ExploreErrorBoundary fallbackTitle="Recent plans unavailable">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Recent plans
              </h2>
              <div className="relative z-20 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
                <button
                  type="button"
                  aria-label="View one by one"
                  aria-pressed={recentView === 1}
                  onClick={() => setRecentView(1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                    recentView === 1
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="View by two"
                  aria-pressed={recentView === 2}
                  onClick={() => setRecentView(2)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                    recentView === 2
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Columns2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="View by four"
                  aria-pressed={recentView === 4}
                  onClick={() => setRecentView(4)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                    recentView === 4
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Grid2x2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {recentView === 1 ? (
              <div className="flex flex-col gap-6">
                {RECENT_PLANS.map((plan) => {
                  const author = getUserById(plan.authorId);
                  if (!author) {
                    return null;
                  }
                  return (
                    <PlanCardHorizontal
                      key={plan.id}
                      plan={plan}
                      author={author}
                      onShare={openShare}
                      variant="recent1"
                    />
                  );
                })}
              </div>
            ) : null}
            {recentView === 2 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {RECENT_PLANS.map((plan) => {
                  const author = getUserById(plan.authorId);
                  if (!author) {
                    return null;
                  }
                  return (
                    <PlanCardVertical
                      key={plan.id}
                      plan={plan}
                      author={author}
                      onShare={openShare}
                      variant="recent2"
                    />
                  );
                })}
              </div>
            ) : null}
            {recentView === 4 ? (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {RECENT_PLANS.map((plan) => {
                  const author = getUserById(plan.authorId);
                  if (!author) {
                    return null;
                  }
                  return (
                    <PlanCardVertical
                      key={plan.id}
                      plan={plan}
                      author={author}
                      onShare={openShare}
                      variant="recent4"
                    />
                  );
                })}
              </div>
            ) : null}
          </section>
        </ExploreErrorBoundary>
      </div>

      <ShareDialog.Root open={shareOpen} plan={sharePlan} onClose={closeShare}>
        <ShareDialog.Overlay />
        <ShareDialog.Content>
          <ShareDialog.Header />
          <ShareDialog.Preview />
          <ShareDialog.Link />
          <ShareDialog.Invite />
          <ShareDialog.Actions />
        </ShareDialog.Content>
      </ShareDialog.Root>
    </div>
  );
}
