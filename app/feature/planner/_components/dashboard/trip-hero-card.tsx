"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CalendarRange,
  CheckSquare,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

import type { TripResponse } from "../planner-api";
import { TripStatTile } from "./trip-stat-tile";
import { TripStatusBadge } from "./trip-status-badge";
import {
  buildTripHref,
  formatCountdown,
  formatTripDateRange,
  getTripDayCount,
  getTripLocationLabel,
  getTripStatus,
} from "./trip-dashboard.utils";
import { useTripPlanStats } from "./use-trip-plan-stats";

type TripHeroCardProps = {
  trip: TripResponse;
  className?: string;
};

export function TripHeroCard({ trip, className }: TripHeroCardProps) {
  const status = useMemo(() => getTripStatus(trip), [trip]);
  const dateRange = useMemo(() => formatTripDateRange(trip), [trip]);
  const dayCount = useMemo(() => getTripDayCount(trip), [trip]);
  const href = useMemo(() => buildTripHref(trip), [trip]);
  const location = useMemo(() => getTripLocationLabel(trip), [trip]);
  const { data: stats, isPending } = useTripPlanStats(trip.id);

  const checklistLabel =
    stats && stats.checklistTotalCount > 0
      ? `${stats.checklistDoneCount}/${stats.checklistTotalCount}`
      : "—";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-lg",
        className,
      )}
      aria-labelledby={`trip-hero-title-${trip.id}`}
    >
      {/* Top light source: brand wash behind the header block */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-primary/25 via-primary/8 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/20 to-transparent"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TripStatusBadge status={status} />
            <span className="text-xs font-medium text-muted-foreground">
              {formatCountdown(trip, status)}
            </span>
          </div>

          <h2
            id={`trip-hero-title-${trip.id}`}
            className="text-2xl leading-tight font-extrabold text-foreground sm:text-3xl"
          >
            {trip.displayName}
          </h2>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{location || "Destination pending"}</span>
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TripStatTile
            icon={CalendarRange}
            label="Dates"
            value={dateRange}
            hint={dayCount === 1 ? "1 day" : `${dayCount} days`}
          />
          <TripStatTile
            icon={Sparkles}
            label="Saved places"
            value={String(stats?.placeCount ?? 0)}
            hint={
              stats && stats.blockCount > 0
                ? `${stats.blockCount} planned block${stats.blockCount === 1 ? "" : "s"}`
                : "Nothing added yet"
            }
            isLoading={isPending}
          />
          <TripStatTile
            icon={Zap}
            label="Charging stops"
            value={String(stats?.chargerCount ?? 0)}
            hint="EV stations on route"
            isLoading={isPending}
          />
          <TripStatTile
            icon={CheckSquare}
            label="Checklist"
            value={checklistLabel}
            hint="Items packed"
            isLoading={isPending}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated {formatUpdatedAt(trip.updatedAt)}
          </p>
          <Link
            href={href}
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full px-8 shadow-md shadow-primary/25 transition-shadow hover:shadow-lg hover:shadow-primary/30",
            )}
          >
            Continue planning
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatUpdatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "recently";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
