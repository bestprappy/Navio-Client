import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";

import { getPlanHref, type Plan } from "./data";
import { PlanTag } from "./plan-tag";

/** Compact horizontal preview for destination recommendations. */
export function PlanPreviewCard({ plan }: { plan: Plan }) {
  return (
    <article>
      <Link
        href={getPlanHref(plan)}
        className="group flex min-w-0 gap-3 rounded-xl py-3 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4"
      >
        <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary sm:h-32 sm:w-36">
          <Image src={plan.imageUrl} alt="" fill sizes="(max-width: 640px) 104px, 156px" className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">{plan.title}</h3>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><ArrowUpRight aria-hidden="true" className="size-4" /></span>
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">{plan.description}</p>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star aria-hidden="true" className="size-3.5 fill-[var(--planner-block-gold)] text-[var(--planner-block-gold)]" />{plan.rating.toFixed(1)} ({plan.reviews.toLocaleString()})</span>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">By {plan.creator}</span>
            <div className="flex flex-wrap gap-2">
              {plan.tags.slice(0, 3).map((tag) => <PlanTag key={tag} label={tag} />)}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
