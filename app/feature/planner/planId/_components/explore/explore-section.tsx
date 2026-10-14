"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { ArrowUpRight, BookOpen, Compass, MapPin, Route } from "lucide-react";

import { TripGuides } from "@/app/feature/guides/trip-guides";
import { PlannerErrorBoundary } from "../../../_components/planner-error-boundary";
import { SharedPlanCard } from "@/app/feature/explore/_components/shared-plans/shared-plan-card";
import {
  EXPLORE_MAX_PAGE_SIZE,
  type ExplorePlan,
} from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { useExplorePlans } from "@/app/feature/explore/_components/shared-plans/use-explore-plans";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPlannerExploreDestinations,
  getTripDestinations,
  selectPlannerExplorePlans,
} from "../../../_components/trip-destinations";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";

type PlannerExploreCarouselProps = {
  destinations: readonly string[];
  plans: readonly ExplorePlan[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export const PLANNER_EXPLORE_CAROUSEL_OPTIONS = {
  align: "start",
  containScroll: "trimSnaps",
  dragFree: false,
  duration: 18,
  loop: false,
  skipSnaps: false,
} as const;

const CAROUSEL_ARROW_CLASS =
  "top-3.5 z-20 size-8 translate-y-0 border-border/60 bg-background/90 text-foreground opacity-90 shadow-sm backdrop-blur-md transition-[border-color,box-shadow,transform,opacity] duration-150 ease-out [&_svg]:size-4 hover:border-primary/30 hover:bg-background hover:opacity-100 hover:shadow-md active:scale-95 focus-visible:opacity-100 disabled:opacity-35 motion-reduce:transition-none motion-reduce:active:scale-100";

export function PlannerExploreCarousel({
  destinations,
  plans,
  isLoading,
  isError,
  onRetry,
}: PlannerExploreCarouselProps) {
  const destinationLabel = destinations.join(", ") || "your trip";

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading shared plans">
        <Skeleton className="h-52 w-full rounded-xl @min-[34rem]:h-44" />
        <div className="space-y-2 px-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <p role="alert" className="text-sm text-foreground">Shared plans could not be loaded.</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>Try again</Button>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-sm leading-relaxed text-muted-foreground">
        No shared itineraries for {destinationLabel} yet.
      </p>
    );
  }

  return (
    <Carousel
      opts={PLANNER_EXPLORE_CAROUSEL_OPTIONS}
      aria-label={`Shared plans for ${destinationLabel}`}
      className="min-w-0"
    >
      <CarouselContent className="-ml-3 py-1">
        {plans.map((plan) => (
          <CarouselItem key={plan.token} className="basis-full pl-3">
            <div className="h-full min-w-0">
              <SharedPlanCard plan={plan} layout="planner" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {plans.length > 1 && (
        <>
          <CarouselPrevious
            className={`${CAROUSEL_ARROW_CLASS} right-12 left-auto hover:-translate-x-0.5`}
          />
          <CarouselNext
            className={`${CAROUSEL_ARROW_CLASS} right-3.5 hover:translate-x-0.5`}
          />
        </>
      )}
    </Carousel>
  );
}

type PlannerExploreContentProps = {
  countryLabel: string;
  destinationLabel: string;
  sharedPlans: ReactNode;
  travelGuides: ReactNode;
};

export function PlannerExploreContent({
  countryLabel,
  destinationLabel,
  sharedPlans,
  travelGuides,
}: PlannerExploreContentProps) {
  return (
    <div className="@container min-w-0">
      <div
        data-slot="planner-explore-frame"
        className="relative min-w-0 overflow-clip rounded-[1.5rem] border border-border/60 bg-card shadow-md shadow-foreground/[0.04]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.055] to-transparent"
        />
        <section
          data-slot="planner-shared-plans-module"
          aria-labelledby="planner-shared-plans-title"
          className="relative min-w-0 p-4 @min-[34rem]:p-5"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/5">
              <Route className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.16em] text-primary uppercase">
                <span className="shrink-0">Plan inspiration</span>
                <span aria-hidden="true">·</span>
                <span className="truncate tracking-normal normal-case" title={countryLabel}>
                  {countryLabel}
                </span>
              </p>
              <h3
                id="planner-shared-plans-title"
                className="text-base font-semibold tracking-tight @min-[34rem]:text-lg"
              >
                Shared plans
              </h3>
              <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                Popular itineraries for your stops in {countryLabel}.
              </p>
            </div>
          </div>
          <div className="my-3.5 flex min-w-0 items-center gap-2 rounded-xl border border-border/50 bg-background/75 px-3 py-2 text-sm text-foreground shadow-xs">
            <MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              Destinations
            </span>
            <span className="min-w-0 truncate font-medium" title={destinationLabel}>
              {destinationLabel}
            </span>
          </div>
          <div className="min-w-0 overflow-hidden rounded-2xl">{sharedPlans}</div>
        </section>

        <section
          data-slot="planner-travel-guides-module"
          aria-labelledby="planner-travel-guides-title"
          className="relative min-w-0 border-t border-border/60 bg-muted/20 p-4 @min-[34rem]:p-5"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent shadow-sm shadow-accent/5">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent uppercase">
                Local knowledge
              </p>
              <h3
                id="planner-travel-guides-title"
                className="mt-0.5 text-base font-semibold tracking-tight @min-[34rem]:text-lg"
              >
                Travel guides
              </h3>
              <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                Local places and practical advice selected by travelers.
              </p>
            </div>
          </div>
          <div className="mt-4 min-w-0">{travelGuides}</div>
        </section>
      </div>
    </div>
  );
}

export function ExploreSection({ destinationName, country }: { destinationName: string; country: string }) {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const destinations = useMemo(
    () => getPlannerExploreDestinations(getTripDestinations(destinationName, blocks)),
    [blocks, destinationName],
  );
  const shared = useExplorePlans(null, "trending", EXPLORE_MAX_PAGE_SIZE);
  const plans = useMemo(
    () => selectPlannerExplorePlans(destinations, shared.plans),
    [destinations, shared.plans],
  );
  const destinationLabel = destinations.join(", ") || destinationName;

  return (
    <section className="mt-4 px-4 py-4">
      <Accordion defaultValue={["explore"]}>
        <AccordionItem value="explore" className="border-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <AccordionTrigger iconSide="left" className="py-0 text-2xl font-bold tracking-tight hover:no-underline">
                Explore
              </AccordionTrigger>
            </div>
            <Link
              href="/explore"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3.5 text-sm font-medium text-foreground shadow-sm transition-[border-color,background-color,box-shadow] hover:border-primary/30 hover:bg-primary/5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              Explore all
              <ArrowUpRight className="size-3.5 text-primary" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Compass className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">
              Plans and guides for {country === "Your trip" ? destinationName : country}
            </span>
          </p>
          <AccordionContent className="pt-4 [&_a]:no-underline">
            <PlannerExploreContent
              countryLabel={country === "Your trip" ? destinationName : country}
              destinationLabel={destinationLabel}
              sharedPlans={(
                <PlannerExploreCarousel
                  destinations={destinations}
                  plans={plans}
                  isLoading={shared.isLoading}
                  isError={shared.isError}
                  onRetry={() => { void shared.refetch(); }}
                />
              )}
              travelGuides={(
                <PlannerErrorBoundary fallbackTitle="Trip guides unavailable" fallbackDescription="Reload the page to try again.">
                  <TripGuides initial={destinationName} country={country} blocks={blocks} />
                </PlannerErrorBoundary>
              )}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
