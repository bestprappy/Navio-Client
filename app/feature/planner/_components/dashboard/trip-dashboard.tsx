"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Compass, Plus, Route } from "lucide-react";

import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";
import { PLANS } from "../../../explore/_components/data";
import { PlanPreviewCard } from "../../../explore/_components/plan-preview-card";
import type { TripResponse } from "../planner-api";
import { TripSummaryCard } from "./trip-summary-card";
import { getTripStatus, sortTrips } from "./trip-dashboard.utils";

export const PLANNER_SETUP_HREF = "/planner/new";

type TripDashboardContextValue = {
  upcomingTrips: readonly TripResponse[];
  pastTrips: readonly TripResponse[];
};
const TripDashboardContext = createContext<TripDashboardContextValue | null>(null);

export function useTripDashboardContext(): TripDashboardContextValue {
  const context = useContext(TripDashboardContext);
  if (!context) throw new Error("TripDashboard compound components must be rendered inside <TripDashboard>.");
  return context;
}

function TripDashboardRoot({ trips, children }: { trips: readonly TripResponse[]; children: ReactNode }) {
  const value = useMemo(() => {
    const sorted = sortTrips(trips);
    return {
      upcomingTrips: sorted.filter((trip) => getTripStatus(trip) !== "past"),
      pastTrips: sorted.filter((trip) => getTripStatus(trip) === "past"),
    };
  }, [trips]);
  return (
    <TripDashboardContext.Provider value={value}>
      <section aria-label="Your travel dashboard" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        {children}
      </section>
    </TripDashboardContext.Provider>
  );
}

function TripDashboardHeader() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.trim().split(/\s+/)[0];
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">A little planning. A great journey.</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{firstName ? `Welcome back, ${firstName}` : "Your next adventure starts here"}</h1>
        <p className="text-sm text-muted-foreground">Your trips, fresh ideas, and a little inspiration for the road ahead.</p>
      </div>
      <Link href={PLANNER_SETUP_HREF} className={cn(buttonVariants({ size: "lg" }), "w-fit shrink-0 rounded-full px-5")}>
        <Plus aria-hidden="true" className="size-4" />Plan a new trip
      </Link>
    </header>
  );
}

function TripDashboardUpcoming() {
  const { upcomingTrips } = useTripDashboardContext();
  return (
    <section aria-labelledby="upcoming-trips-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="upcoming-trips-title" className="text-lg font-semibold">Upcoming trips <span className="ml-2 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">{upcomingTrips.length}</span></h2>
          <p className="mt-1 text-sm text-muted-foreground">Something to look forward to. Pick up where you left off.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {upcomingTrips.map((trip) => <TripSummaryCard key={trip.id} trip={trip} className="min-w-0" />)}
        <Link href={PLANNER_SETUP_HREF} className="group flex min-h-56 flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-primary/35 bg-secondary/40 p-6 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-10 items-center justify-center rounded-full bg-card text-primary"><Route aria-hidden="true" className="size-5" /></span>
          <span className="text-base font-semibold">{upcomingTrips.length ? "Where to next?" : "Your next trip belongs here"}</span>
          <span className="max-w-64 text-sm leading-relaxed text-muted-foreground">Choose a destination and make room for a new adventure.</span>
          <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-primary">Start planning<ArrowRight aria-hidden="true" className="size-4" /></span>
        </Link>
      </div>
    </section>
  );
}

function TripDashboardExplore() {
  const { upcomingTrips } = useTripDashboardContext();
  const destination = upcomingTrips[0]?.destinationName;
  const matchingPlans = useMemo(() => {
    if (!destination) return [];
    const normalized = destination.toLocaleLowerCase();
    return PLANS.filter((plan) => normalized.includes(plan.province.toLocaleLowerCase()));
  }, [destination]);
  const plans = matchingPlans.length ? matchingPlans : PLANS;

  const recommendations = plans.slice(0, 3);
  return (
    <section aria-labelledby="explore-plans-title" className="min-w-0">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase"><Compass aria-hidden="true" className="size-4" />Explore plans</p>
            <h2 id="explore-plans-title" className="text-xl font-semibold">{matchingPlans.length ? `For your ${destination} trip` : "Find inspiration for your next trip"}</h2>
            <p className="text-sm text-muted-foreground">{destination && !matchingPlans.length ? `No plans for ${destination} yet. Explore ideas for another adventure.` : "Discover itineraries and stops worth making your own."}</p>
          </div>
          <Link href="/explore" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>Explore more<ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
        <div className="divide-y divide-border/50">
          {recommendations.map((plan) => <div key={plan.id} className="py-2"><PlanPreviewCard plan={plan} /></div>)}
          {!recommendations.length && <p className="p-4 text-sm text-muted-foreground">New itineraries will appear here when available.</p>}
        </div>
      </div>
      
    </section>
  );
}

function TripDashboardPast() {
  const { pastTrips } = useTripDashboardContext();
  if (!pastTrips.length) return null;
  return <section aria-labelledby="past-trips-title" className="space-y-4 border-t border-border/60 pt-6">
    <h2 id="past-trips-title" className="text-lg font-semibold">Past adventures</h2>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{pastTrips.map((trip) => <TripSummaryCard key={trip.id} trip={trip} className="min-w-0" />)}</div>
  </section>;
}

export const TripDashboard = Object.assign(TripDashboardRoot, {
  Header: TripDashboardHeader,
  Upcoming: TripDashboardUpcoming,
  Explore: TripDashboardExplore,
  Past: TripDashboardPast,
});

export function TripDashboardView({ trips }: { trips: readonly TripResponse[] }) {
  return <TripDashboard trips={trips}><TripDashboard.Header /><TripDashboard.Upcoming /><TripDashboard.Explore /><TripDashboard.Past /></TripDashboard>;
}

