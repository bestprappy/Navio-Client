import { Eye, MapPin } from "lucide-react";

import { PlanAuthor } from "@/app/feature/explore/_components/shared-plans/plan-author";

import type { PublicPlanSnapshot } from "./publication-api";

function formatPublishedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type SharedPlanHeaderProps = {
  plan: PublicPlanSnapshot;
  publishedAt: string;
  /** The owner's byline; null shows "a Navio traveler". */
  authorName: string | null;
};

/**
 * Title block for a published plan: what it is, where, how long, and that it is
 * read-only. Used by the shared-link page and the Explore reading page.
 */
export function SharedPlanHeader({ plan, publishedAt, authorName }: SharedPlanHeaderProps) {
  const destination = [plan.destinationCity, plan.destinationCountry].filter(Boolean).join(", ");
  const published = formatPublishedAt(publishedAt);

  return (
    <header className="space-y-3 border-b border-border pb-6">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="size-4" aria-hidden="true" />
        Published plan, view only
      </p>
      <h1 className="text-2xl font-semibold text-balance text-foreground sm:text-3xl">
        {plan.title ?? "Shared plan"}
      </h1>
      <PlanAuthor name={authorName} size="default" className="text-sm text-muted-foreground" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {destination && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden="true" />
            {destination}
          </span>
        )}
        <span>
          {plan.dayCount} {plan.dayCount === 1 ? "day" : "days"}
        </span>
        {published && <span>Published {published}</span>}
      </div>
    </header>
  );
}
