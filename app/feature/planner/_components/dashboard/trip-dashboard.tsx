"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

import type { TripResponse } from "../planner-api";
import { TripHeroCard } from "./trip-hero-card";
import { TripSummaryCard } from "./trip-summary-card";
import { selectCurrentTrip, sortTrips } from "./trip-dashboard.utils";

export const PLANNER_SETUP_HREF = "/planner/new";

type TripDashboardContextValue = {
  trips: readonly TripResponse[];
  currentTrip: TripResponse | null;
  otherTrips: readonly TripResponse[];
};

const TripDashboardContext = createContext<TripDashboardContextValue | null>(
  null,
);

export function useTripDashboardContext(): TripDashboardContextValue {
  const context = useContext(TripDashboardContext);
  if (!context) {
    throw new Error(
      "TripDashboard compound components must be rendered inside <TripDashboard>.",
    );
  }
  return context;
}

type TripDashboardRootProps = {
  trips: readonly TripResponse[];
  children: ReactNode;
};

function TripDashboardRoot({ trips, children }: TripDashboardRootProps) {
  const value = useMemo<TripDashboardContextValue>(() => {
    const currentTrip = selectCurrentTrip(trips);
    const otherTrips = sortTrips(
      trips.filter((trip) => trip.id !== currentTrip?.id),
    );
    return { trips, currentTrip, otherTrips };
  }, [trips]);

  return (
    <TripDashboardContext.Provider value={value}>
      <section
        aria-label="Your trips"
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14"
      >
        {children}
      </section>
    </TripDashboardContext.Provider>
  );
}

type TripDashboardHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel: string;
};

function TripDashboardHeader({
  title,
  subtitle,
  actionLabel,
}: TripDashboardHeaderProps) {
  const { trips } = useTripDashboardContext();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">
            {subtitle} · {trips.length} trip{trips.length === 1 ? "" : "s"} saved
          </p>
        ) : null}
      </div>
      <Link
        href={PLANNER_SETUP_HREF}
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "shrink-0 rounded-full px-6",
        )}
      >
        <Plus aria-hidden="true" data-icon="inline-start" />
        {actionLabel}
      </Link>
    </header>
  );
}

function TripDashboardCurrent() {
  const { currentTrip } = useTripDashboardContext();
  if (!currentTrip) return null;
  return <TripHeroCard trip={currentTrip} />;
}

type TripDashboardCollectionProps = {
  title: string;
  emptyLabel: string;
};

function TripDashboardCollection({
  title,
  emptyLabel,
}: TripDashboardCollectionProps) {
  const { otherTrips } = useTripDashboardContext();

  return (
    <section aria-labelledby="trip-collection-title" className="flex flex-col gap-4">
      <h2
        id="trip-collection-title"
        className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {title}
      </h2>

      {otherTrips.length === 0 ? (
        <p className="rounded-[var(--card-radius-lg)] border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherTrips.map((trip) => (
            <li key={trip.id} className="flex">
              <TripSummaryCard trip={trip} className="w-full" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export const TripDashboard = Object.assign(TripDashboardRoot, {
  Header: TripDashboardHeader,
  Current: TripDashboardCurrent,
  Collection: TripDashboardCollection,
});

type TripDashboardViewProps = {
  trips: readonly TripResponse[];
};

export function TripDashboardView({ trips }: TripDashboardViewProps) {
  return (
    <TripDashboard trips={trips}>
      <TripDashboard.Header
        title="Your trips"
        subtitle="Pick up where you left off"
        actionLabel="Plan a new trip"
      />
      <TripDashboard.Current />
      <TripDashboard.Collection
        title="All trips"
        emptyLabel="This is your only trip so far. Plan a new one to see it here."
      />
    </TripDashboard>
  );
}
