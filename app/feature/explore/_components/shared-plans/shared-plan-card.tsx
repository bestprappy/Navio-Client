import { memo } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  explorePlanDestination,
  explorePlanPath,
  type ExplorePlan,
} from "./explore-plans-api";
import { PlanAuthor } from "./plan-author";
import { RouteStrip } from "./route-strip";

type SharedPlanCardProps = {
  plan: ExplorePlan;
  /** "row" matches Explore's one-per-line view; "tile" its grid views. */
  layout?: "tile" | "row";
};

/** Fixed locale and UTC so the server render and the browser agree on hydration. */
function formatListedDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function joinHighlights(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function PlanCover({ plan, className }: { plan: ExplorePlan; className?: string }) {
  const destination = plan.destinationCity || plan.destinationCountry;
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {plan.coverImageUrl ? (
        // A plain img, not next/image: covers come from arbitrary place-photo
        // hosts, and no-referrer keeps the Navio URL out of their logs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={plan.coverImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          // Absolute so the photo fills the cover instead of sizing the card:
          // a portrait image would otherwise make a row card very tall.
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <ItineraryCover plan={plan} destination={destination} />
      )}
    </div>
  );
}

const COVER_DAY_ROWS = 3;

/**
 * With no photo, the cover is the itinerary itself: one row per day. It says
 * more about the trip than a stock image would, and it is unique to the plan.
 * Hidden from assistive technology because the card's route strip already
 * announces the same shape.
 */
function ItineraryCover({ plan, destination }: { plan: ExplorePlan; destination?: string | null }) {
  const rows = plan.days.slice(0, COVER_DAY_ROWS);
  const moreDays = plan.days.length - rows.length;
  return (
    <div aria-hidden="true" className="flex size-full flex-col justify-between gap-3 p-4">
      <span className="text-lg font-semibold text-foreground/70">{destination ?? "Road trip"}</span>
      <div className="space-y-1.5">
        {rows.map((day, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-11 shrink-0 text-xs font-medium text-muted-foreground">Day {index + 1}</span>
            <RouteStrip days={[day]} placeCount={0} chargerCount={0} surface="muted" />
          </div>
        ))}
        {moreDays > 0 && (
          <p className="pl-14 text-xs text-muted-foreground">
            and {moreDays} more {moreDays === 1 ? "day" : "days"}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * A plan a Navio traveller published and listed on Explore.
 *
 * <p>Sits beside the curated plan cards and follows their structure — cover,
 * title, place, footer — so the feed reads as one list. What differs is the
 * route strip, drawn from the real itinerary, and the absence of likes and
 * ratings, which shared plans do not have.
 */
export const SharedPlanCard = memo(function SharedPlanCard({ plan, layout = "tile" }: SharedPlanCardProps) {
  const href = explorePlanPath(plan.token);
  const destination = explorePlanDestination(plan);
  const highlights = joinHighlights(plan.highlights);
  const listed = formatListedDate(plan.listedAt);
  const isRow = layout === "row";

  return (
    <article
      className={cn(
        "group relative flex min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50",
        isRow ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <PlanCover
        plan={plan}
        className={
          isRow ? "aspect-video sm:aspect-auto sm:min-h-48 sm:w-72 sm:shrink-0" : "aspect-video"
        }
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">
            {/* Stretched link: the whole card is one target for pointer and keyboard. */}
            <Link
              href={href}
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

        <RouteStrip days={plan.days} placeCount={plan.placeCount} chargerCount={plan.chargerCount} />

        {highlights && (
          <p className={cn("text-sm text-muted-foreground", isRow ? "line-clamp-2" : "line-clamp-1")}>
            {highlights}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          <PlanAuthor name={plan.authorName} />
          {listed && <span className="shrink-0">Listed {listed}</span>}
        </div>
      </div>
    </article>
  );
});
