"use client";

import { useCallback, useMemo, useState } from "react";
import { useAtom } from "jotai";
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Grid2x2,
  LayoutList,
  SlidersHorizontal,
} from "lucide-react";

import {
  PLANS,
  RECENT_PLANS,
  TRENDING_PLANS,
  getPlanById,
  getUserById,
} from "./data";
import { shareDialogOpenAtom, shareDialogPlanIdAtom } from "./explore-atoms";
import { ExploreErrorBoundary } from "./explore-error-boundary";
import { PlanCardHorizontal } from "./plan-card-horizontal";
import { PlanCardVertical } from "./plan-card-vertical";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ShareDialog } from "./share-dialog";

type FilterSection = {
  title: string;
  options: string[];
};

type FilterGroup = {
  title: string;
  sections: FilterSection[];
};

const FILTER_GROUPS: FilterGroup[] = [
  {
    title: "Destination",
    sections: [
      {
        title: "Provinces",
        options: [
          "Bangkok",
          "Chiang Mai",
          "Chiang Rai",
          "Phuket",
          "Krabi",
          "Koh Samui",
          "Hua Hin",
          "Khao Yai",
          "Ayutthaya",
          "Sukhothai",
          "Pattaya",
          "Mae Hong Son",
          "Khao Sok",
          "Rayong",
          "Phang Nga",
        ],
      },
    ],
  },
  {
    title: "Points of Interest",
    sections: [
      {
        title: "Establishments",
        options: ["Restaurant", "Cafe"],
      },
      {
        title: "Landmarks",
        options: ["Mountain", "Forest", "Waterfall"],
      },
    ],
  },
  {
    title: "Experience",
    sections: [
      {
        title: "Activities",
        options: ["Hiking", "Diving"],
      },
      {
        title: "Vibe",
        options: ["Nature", "Peaceful", "Chilling"],
      },
    ],
  },
];

export function ExplorePage() {
  const [shareOpen, setShareOpen] = useAtom(shareDialogOpenAtom);
  const [sharePlanId, setSharePlanId] = useAtom(shareDialogPlanIdAtom);
  const [recentView, setRecentView] = useState<1 | 2 | 3>(1);
  const [trendingCarouselApi, setTrendingCarouselApi] =
    useState<CarouselApi>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

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

  const toggleFilter = useCallback((value: string) => {
    setSelectedFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPlans = useMemo(() => {
    if (!normalizedQuery && selectedFilters.length === 0) {
      return PLANS;
    }

    const activeFilters = selectedFilters.map((filter) => filter.toLowerCase());

    return PLANS.filter((plan) => {
      const searchableText = [
        plan.title,
        plan.province,
        plan.location,
        plan.creator,
        plan.description,
        ...plan.tags,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = normalizedQuery
        ? searchableText.includes(normalizedQuery)
        : true;
      const matchesFilters = activeFilters.length
        ? activeFilters.every((filter) => searchableText.includes(filter))
        : true;

      return matchesQuery && matchesFilters;
    });
  }, [normalizedQuery, selectedFilters]);

  const isFiltering = normalizedQuery.length > 0 || selectedFilters.length > 0;
  const visiblePlans = isFiltering ? filteredPlans : RECENT_PLANS;
  const resultsLabel = isFiltering ? "Results" : "Recent plans";

  const scrollTrendingPlans = useCallback(
    (direction: -1 | 1) => {
      if (!trendingCarouselApi) return;

      const snapCount = trendingCarouselApi.scrollSnapList().length;
      if (snapCount === 0) return;

      const currentSnap = trendingCarouselApi.selectedScrollSnap();
      const nextSnap = (currentSnap + direction + snapCount) % snapCount;

      trendingCarouselApi.scrollTo(nextSnap);
    },
    [trendingCarouselApi],
  );

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
          <div className="relative w-full max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <input
                  type="text"
                  placeholder="Search a destination"
                  aria-label="Search a destination"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted cursor-pointer ${
                  isFilterOpen
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                }`}
                aria-expanded={isFilterOpen}
                aria-controls="explore-filter-menu"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </button>
            </div>
            {isFilterOpen ? (
              <div
                id="explore-filter-menu"
                className="absolute right-0 top-full z-30 mt-3 w-full rounded-2xl border border-border bg-card p-4 shadow-xl"
              >
                <div className="flex flex-col gap-4">
                  {FILTER_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.title}
                      </p>
                      {group.sections.map((section) => (
                        <div key={section.title} className="space-y-2">
                          <p className="text-xs font-medium text-foreground">
                            {section.title}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {section.options.map((option) => {
                              const isSelected =
                                selectedFilters.includes(option);

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => toggleFilter(option)}
                                  className={`rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {!isFiltering ? (
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
                <Carousel
                  opts={{ align: "start", loop: true, slidesToScroll: 1 }}
                  className="mx-auto w-full max-w-6xl"
                  setApi={setTrendingCarouselApi}
                >
                  <CarouselContent className="-ml-4">
                    {TRENDING_PLANS.slice(0, 6).map((plan) => (
                      <CarouselItem
                        key={plan.id}
                        className="basis-[90%] pl-4 sm:basis-1/2 lg:basis-1/3"
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
                  <button
                    type="button"
                    aria-label="Previous slide"
                    disabled={!trendingCarouselApi}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      scrollTrendingPlans(-1);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        scrollTrendingPlans(-1);
                      }
                    }}
                    className="absolute -left-5 top-32 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted hover:text-foreground active:-translate-y-[54%] active:scale-[0.98] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next slide"
                    disabled={!trendingCarouselApi}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      scrollTrendingPlans(1);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        scrollTrendingPlans(1);
                      }
                    }}
                    className="absolute -right-5 top-32 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted hover:text-foreground active:-translate-y-[54%] active:scale-[0.98] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Carousel>
              </div>
            </section>
          </ExploreErrorBoundary>
        ) : null}

        <ExploreErrorBoundary fallbackTitle="Recent plans unavailable">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {resultsLabel}
                </h2>
                {isFiltering ? (
                  <p className="text-xs text-muted-foreground">
                    {visiblePlans.length} matches found
                  </p>
                ) : null}
              </div>
              <div className="relative z-20 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
                <button
                  type="button"
                  aria-label="View one by one"
                  aria-pressed={recentView === 1}
                  onClick={() => setRecentView(1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer ${
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
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer ${
                    recentView === 2
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Columns2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="View by three"
                  aria-pressed={recentView === 3}
                  onClick={() => setRecentView(3)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer ${
                    recentView === 3
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Grid2x2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {visiblePlans.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
                <p className="text-sm font-semibold text-foreground">
                  No plans match your search.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Try a different keyword or clear some filters.
                </p>
              </div>
            ) : null}
            {recentView === 1 ? (
              <div className="flex flex-col gap-6">
                {visiblePlans.map((plan) => {
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
                      variant="featured"
                    />
                  );
                })}
              </div>
            ) : null}
            {recentView === 2 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {visiblePlans.map((plan) => {
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
                      variant="featured"
                    />
                  );
                })}
              </div>
            ) : null}
            {recentView === 3 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePlans.map((plan) => {
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
                      variant="grid"
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
