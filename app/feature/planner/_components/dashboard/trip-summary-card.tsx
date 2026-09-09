"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, CalendarRange } from "lucide-react";
import { TripNameEditor } from "../../planId/_components/overview/trip-name-editor";
import { TripDestinationLabel } from "./trip-destination-label";
import { TripScenery } from "./scenery";
import { useTripPlanStats } from "./use-trip-plan-stats";

import { cn } from "@/lib/utils";

import type { TripResponse } from "../planner-api";
import { TripStatusBadge } from "./trip-status-badge";
import {
  buildTripHref,
  formatTripDateRange,
  getTripDayCount,
  getTripStatus,
} from "./trip-dashboard.utils";

type TripSummaryCardProps = {
  trip: TripResponse;
  className?: string;
};

export function TripSummaryCard({ trip, className }: TripSummaryCardProps) {
  const status = useMemo(() => getTripStatus(trip), [trip]);
  const dateRange = useMemo(() => formatTripDateRange(trip), [trip]);
  const dayCount = useMemo(() => getTripDayCount(trip), [trip]);
  const href = useMemo(() => buildTripHref(trip), [trip]);
  const stats = useTripPlanStats(trip.id);
  const destinations = [...new Set([trip.destinationName, ...(stats.data?.destinations ?? [])])];

  return (
    <article
      className={cn(
        "group relative isolate flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-2xs",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        status === "past" && "opacity-80 hover:opacity-100",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 -z-10 h-32"><TripScenery destinations={destinations} /></div>
      <div className="flex items-start justify-between gap-3">
        <TripStatusBadge status={status} />
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      </div>

      <TripNameEditor planId={trip.id} trip={trip} destinationName={trip.destinationName} heading="h3" />
      <TripDestinationLabel destinations={destinations} />

      <dl className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Dates</dt>
          <CalendarRange aria-hidden="true" className="size-3.5 shrink-0" />
          <dd className="truncate">
            {dateRange} · {dayCount === 1 ? "1 day" : `${dayCount} days`}
          </dd>
        </div>
      </dl>
      <Link href={href} className="mt-auto rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring">Open trip</Link>
    </article>
  );
}
