"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CalendarRange,
  CheckSquare,
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
  getTripStatus,
} from "./trip-dashboard.utils";
import { useTripPlanStats } from "./use-trip-plan-stats";
import { TripNameEditor } from "../../planId/_components/overview/trip-name-editor";
import { TripScenery } from "./scenery";
import { TripDestinationLabel } from "./trip-destination-label";

type TripHeroCardProps = {
  trip: TripResponse;
  className?: string;
};

export function TripHeroCard({ trip, className }: TripHeroCardProps) {
  const status = useMemo(() => getTripStatus(trip), [trip]);
  const dateRange = useMemo(() => formatTripDateRange(trip), [trip]);
  const dayCount = useMemo(() => getTripDayCount(trip), [trip]);
  const href = useMemo(() => buildTripHref(trip), [trip]);
  const { data: stats, isPending } = useTripPlanStats(trip.id);
  const destinations = [...new Set([trip.destinationName, ...(stats?.destinations ?? [])])];

  const checklistLabel =
    stats && stats.checklistTotalCount > 0
      ? `${stats.checklistDoneCount}/${stats.checklistTotalCount}`
      : "—";

  return (
    <article
      className={cn(
        "@container/tripcard relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm",
        className,
      )}
      aria-label="Featured trip"
    >
      <div className="relative flex flex-col">
        <header className="relative isolate flex min-h-60 flex-col justify-center gap-4 overflow-hidden border-b border-border p-5 sm:p-7">
          <TripScenery destinations={[...destinations, trip.destinationCountry ?? ""]} />
          <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <TripStatusBadge status={status} />
            <span className="text-xs font-medium text-muted-foreground">
              {formatCountdown(trip, status)}
            </span>
          </div>

          <TripNameEditor planId={trip.id} trip={trip} destinationName={trip.destinationName} heading="h2" />
          <TripDestinationLabel destinations={destinations} />
          </div>
        </header>
        <div className="grid grid-cols-1 gap-3 p-5 @xs/tripcard:grid-cols-2 sm:p-7">
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
                ? `${stats.blockCount} itinerary day${stats.blockCount === 1 ? "" : "s"}`
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

        <div className="flex flex-col gap-3 border-t border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
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
