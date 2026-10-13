"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";

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

const CAROUSEL_ARROW_CLASS =
  "top-3 z-20 size-7 translate-y-0 border-border/70 bg-background/80 text-foreground opacity-80 shadow-md backdrop-blur-sm transition-[opacity,transform,background-color] duration-200 ease-out [&_svg]:size-3.5 hover:bg-background/95 hover:opacity-100 active:scale-95 focus-visible:opacity-100 disabled:opacity-30 motion-reduce:transition-none motion-reduce:active:scale-100";

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
        <Skeleton className="aspect-video w-full rounded-lg" />
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
      opts={{ align: "start", loop: plans.length > 1 }}
      aria-label={`Shared plans for ${destinationLabel}`}
    >
      <CarouselContent className="ml-0">
        {plans.map((plan) => (
          <CarouselItem key={plan.token} className="basis-full pl-0">
            <SharedPlanCard plan={plan} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {plans.length > 1 && (
        <>
          <CarouselPrevious
            className={`${CAROUSEL_ARROW_CLASS} right-11 left-auto hover:-translate-x-0.5`}
          />
          <CarouselNext
            className={`${CAROUSEL_ARROW_CLASS} right-3 hover:translate-x-0.5`}
          />
        </>
      )}
    </Carousel>
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
            <AccordionTrigger iconSide="left" className="py-0 text-2xl font-bold hover:no-underline">Explore</AccordionTrigger>
            <Link href="/explore" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring">See more <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <AccordionContent className="pt-4 [&_a]:no-underline">
            <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><Compass className="size-4 text-primary" aria-hidden="true" />Explore {country === "Your trip" ? destinationName : country}</p>
            <h3
              className="mb-3 flex min-w-0 items-start gap-2 text-sm font-semibold"
              title={destinationLabel}
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="line-clamp-2 min-w-0 break-words">{destinationLabel}</span>
            </h3>
            <PlannerExploreCarousel
              destinations={destinations}
              plans={plans}
              isLoading={shared.isLoading}
              isError={shared.isError}
              onRetry={() => { void shared.refetch(); }}
            />
            <PlannerErrorBoundary fallbackTitle="Trip guides unavailable" fallbackDescription="Reload the page to try again."><TripGuides initial={destinationName} country={country} blocks={blocks} /></PlannerErrorBoundary>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
