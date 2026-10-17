"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { TravelerGuideCard } from "./guide-card";
import { GuideCarousel } from "./guide-carousel";
import {
  discoverGuides,
  travelerGuideKeys,
  type GuideDiscoveryFilter,
} from "./user-guides-api";

/** Server search and pagination are shared by Explore, the dashboard and trip countries. */
export function GuideDiscovery({
  filter = {},
  preview = false,
  carouselTitle,
}: {
  filter?: GuideDiscoveryFilter;
  preview?: boolean;
  carouselTitle?: string;
}) {
  const result = useInfiniteQuery({
    queryKey: [...travelerGuideKeys, "discovery", filter],
    queryFn: ({ pageParam }) => discoverGuides(filter, pageParam),
    initialPageParam: 0,
    getNextPageParam: (page) =>
      page.number + 1 < page.totalPages ? page.number + 1 : undefined,
    staleTime: 30_000,
  });
  const guides = result.data?.pages.flatMap((page) => page.content) ?? [];
  let content: ReactNode;
  if (result.isPending) {
    content = (
      <div
        role="status"
        aria-label="Loading guides"
        className={
          carouselTitle
            ? "flex gap-4 overflow-hidden"
            : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {Array.from({ length: carouselTitle ? 2 : 3 }, (_, index) => (
          <Skeleton
            key={index}
            className={
              carouselTitle
                ? "aspect-3/2 w-full shrink-0 rounded-xl"
                : "aspect-3/2 rounded-xl"
            }
          />
        ))}
      </div>
    );
  } else if (result.isError && !result.data) {
    content = (
      <div role="alert" className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Guides could not be loaded.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void result.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  } else if (!guides.length) {
    content = (
      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-5">
        <BookOpen
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {filter.term
              ? `No guides for “${filter.term}”`
              : filter.cities?.length || filter.destinations?.length
                ? "No published guides for this city yet"
                : filter.country
                  ? `No published guides for ${filter.country} yet`
                  : "The next discovery could be yours"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter.term
              ? "Try another city, country or guide title."
              : "Travelers' published guides will appear here."}
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="space-y-5">
        {carouselTitle ? (
          <CarouselContent className="-ml-3 py-1">
            {guides.map((guide, index) => (
              <CarouselItem
                key={guide.id}
                aria-label={`${index + 1} of ${guides.length}`}
                className="basis-full pl-3"
              >
                <div className="h-full">
                  <TravelerGuideCard guide={guide} layout="planner" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        ) : (
          <ul
            aria-label="Published guides"
            className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {guides.map((guide) => (
              <li key={guide.id} className="min-w-0">
                <TravelerGuideCard guide={guide} />
              </li>
            ))}
          </ul>
        )}
        {result.isError ? (
          <p role="alert" className="text-sm text-destructive">
            The latest guides could not be refreshed. Try again.
          </p>
        ) : null}
        {!preview && result.hasNextPage ? (
          <Button
            variant="outline"
            disabled={result.isFetchingNextPage}
            onClick={() => void result.fetchNextPage()}
          >
            {result.isFetchingNextPage ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : null}
            {result.isFetchNextPageError
              ? "Retry loading guides"
              : result.isFetchingNextPage
                ? "Loading…"
                : "Load more guides"}
          </Button>
        ) : null}
      </div>
    );
  }
  return carouselTitle ? (
    <GuideCarousel title={carouselTitle} guideCount={guides.length}>
      {content}
    </GuideCarousel>
  ) : (
    content
  );
}
