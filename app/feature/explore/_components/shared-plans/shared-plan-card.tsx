import { memo } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  explorePlanDestination,
  explorePlanPath,
  type ExplorePlan,
} from "./explore-plans-api";
import { PlanAuthor } from "./plan-author";
import { PlanCover } from "./plan-cover";
import { PlanEngagement } from "./plan-engagement";

type SharedPlanCardProps = {
  plan: ExplorePlan;
  /** "row" matches Explore's one-per-line view; "tile" its grid views. */
  layout?: "tile" | "row" | "planner";
};

/**
 * A plan a Navio traveller published and listed on Explore.
 *
 * <p>Sits beside the curated plan cards and follows their structure — cover,
 * title, place, footer — so the feed reads as one list. What differs is the
 * duration, stop counts, real recorded activity and an explicit unrated state.
 */
export const SharedPlanCard = memo(function SharedPlanCard({ plan, layout = "tile" }: SharedPlanCardProps) {
  const href = explorePlanPath(plan.token);
  const destination = explorePlanDestination(plan);
  const highlights = plan.highlights.slice(0, 3).join(", ");
  const isRow = layout === "row";
  const isPlanner = layout === "planner";

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50 motion-reduce:transition-none",
        isRow
          ? "flex-col sm:flex-row"
          : isPlanner
            ? "flex-col @min-[30rem]:flex-row"
            : "flex-col",
      )}
    >
      <PlanCover
        plan={plan}
        className={
          isRow
            ? "aspect-[16/9] sm:aspect-auto sm:min-h-48 sm:w-60 sm:shrink-0"
            : isPlanner
              ? "aspect-[16/7] bg-muted/70 @min-[30rem]:aspect-auto @min-[30rem]:min-h-40 @min-[30rem]:w-[42%] @min-[30rem]:shrink-0"
              : "aspect-[16/9]"
        }
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
        <div className={cn("min-w-0 space-y-1", isPlanner && "@min-[30rem]:pr-16")}>
          <h3 className="line-clamp-2 min-h-11 text-base font-semibold leading-snug tracking-tight text-foreground">
            {/* Stretched link: the whole card is one target for pointer and keyboard. */}
            <Link
              href={href}
              prefetch={false}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-hover:underline decoration-2 underline-offset-4"
            >
              {plan.title || destination || "Shared plan"}
            </Link>
          </h3>
          {destination && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{destination}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{plan.dayCount} {plan.dayCount === 1 ? "day" : "days"}</span>
          <span>{plan.placeCount} {plan.placeCount === 1 ? "place" : "places"}</span>
          {plan.chargerCount > 0 && <span className="inline-flex items-center gap-1"><Zap className="size-3 text-charging" aria-hidden="true" />{plan.chargerCount} charging {plan.chargerCount === 1 ? "stop" : "stops"}</span>}
        </div>

        {highlights && (
          <p className={cn("text-sm text-muted-foreground", isRow ? "line-clamp-2" : "line-clamp-1")}>
            {highlights}
          </p>
        )}

        <div
          className={cn(
            "mt-auto flex items-center justify-between gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground",
            isPlanner ? "flex-nowrap" : "flex-wrap",
          )}
        >
          <PlanAuthor name={plan.authorName} />

        </div>
        <div className="border-t border-border/60 pt-3">
          <PlanEngagement viewCount={plan.viewCount} copyCount={plan.copyCount} />
        </div>
      </div>
    </article>
  );
});
