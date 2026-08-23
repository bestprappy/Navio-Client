"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

import {
  PLANNER_SETUP_HREF,
  TripDashboardView,
} from "./_components/dashboard/trip-dashboard";
import { TripDashboardSkeleton } from "./_components/dashboard/trip-dashboard.skeleton";
import { listTrips } from "./_components/planner-api";
import { PlannerErrorBoundary } from "./_components/planner-error-boundary";
import { PlannerSetupView } from "./planner-setup";

const TRIP_PAGE_SIZE = 30;

/**
 * Planner entry point. Returning travellers land on a dashboard of their
 * trips; first-time travellers land straight on the setup form.
 */
export function PlannerHomeView() {
  const tripsQuery = useQuery({
    queryKey: ["planner", "trips", { page: 0, size: TRIP_PAGE_SIZE }],
    queryFn: () => listTrips(0, TRIP_PAGE_SIZE),
    staleTime: 30_000,
    retry: 1,
  });

  if (tripsQuery.isPending) {
    return <TripDashboardSkeleton />;
  }

  if (tripsQuery.isError) {
    return (
      <TripLoadError
        message={
          tripsQuery.error instanceof Error
            ? tripsQuery.error.message
            : "We could not load your trips."
        }
        onRetry={() => void tripsQuery.refetch()}
        isRetrying={tripsQuery.isFetching}
      />
    );
  }

  const trips = tripsQuery.data?.content ?? [];

  if (trips.length === 0) {
    return <PlannerSetupView />;
  }

  return (
    <PlannerErrorBoundary
      fallbackTitle="We could not display your trips"
      fallbackDescription="Refresh the page, or start a new trip to keep planning."
    >
      <TripDashboardView trips={trips} />
    </PlannerErrorBoundary>
  );
}

type TripLoadErrorProps = {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
};

function TripLoadError({ message, onRetry, isRetrying }: TripLoadErrorProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-6 py-16 text-center sm:px-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-foreground">
          We could not load your trips
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          size="lg"
          onClick={onRetry}
          disabled={isRetrying}
          className="rounded-full px-8"
        >
          <RefreshCcw
            aria-hidden="true"
            data-icon="inline-start"
            className={cn(isRetrying && "animate-spin")}
          />
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
        <Link
          href={PLANNER_SETUP_HREF}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-full px-8",
          )}
        >
          Plan a new trip
        </Link>
      </div>
    </section>
  );
}
