"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, CalendarRange, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TripResponse } from "../planner-api";
import { TripStatusBadge } from "./trip-status-badge";
import {
  buildTripHref,
  formatTripDateRange,
  getTripDayCount,
  getTripLocationLabel,
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
  const location = useMemo(() => getTripLocationLabel(trip), [trip]);

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 rounded-[var(--card-radius-lg)] border border-border bg-card p-5 shadow-2xs",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        status === "past" && "opacity-80 hover:opacity-100",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <TripStatusBadge status={status} />
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      </div>

      <h3 className="line-clamp-2 text-base leading-snug font-bold text-foreground">
        {trip.displayName}
      </h3>

      <dl className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Destination</dt>
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <dd className="truncate">{location || "Destination pending"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Dates</dt>
          <CalendarRange aria-hidden="true" className="size-3.5 shrink-0" />
          <dd className="truncate">
            {dateRange} · {dayCount === 1 ? "1 day" : `${dayCount} days`}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
