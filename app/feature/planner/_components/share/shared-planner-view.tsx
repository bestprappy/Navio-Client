"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { ArrowLeft, Eye, MapPin } from "lucide-react";

import { CopySharedPlanButton } from "@/app/feature/explore/_components/shared-plans/copy-shared-plan-button";
import { PlanAuthor } from "@/app/feature/explore/_components/shared-plans/plan-author";
import { getCurrencyOption } from "../../planId/_components/budget/budget.data";
import { BudgetSection } from "../../planId/_components/budget/budget-section";
import type { TripBlockData } from "../../planId/_components/constants/types";
import { DayNavSidebar } from "../../planId/_components/itinerary/day-nav-sidebar";
import { ItinerarySection } from "../../planId/_components/itinerary/itinerary-section";
import { PlannerWorkspace } from "../../planId/_components/layout/planner-workspace";
import { TripBuilderErrorBoundary } from "../../planId/_components/overview/trip-builder-error-boundary";
import {
  activeBlockIdAtom,
  openBlockIdsAtom,
  plannerReadOnlyAtom,
  tripBlocksAtom,
  tripBudgetAtom,
  tripCurrencyAtom,
  tripDateRangeAtom,
  tripExpensesAtom,
} from "../../planId/_components/overview/trip-builder.atoms";
import { TripHero } from "../../planId/_components/overview/trip-hero";
import { TripInfoCardShell } from "../../planId/_components/overview/trip-info-card";
import { PlannerMap } from "../../planId/planner-map";
import { EvPlanDisclaimer, hasChargerStops } from "./ev-plan-disclaimer";
import type { SharedPlan } from "./publication-api";
import { SharedDayAnchors } from "./shared-day-anchors";
import { getSharedPlanCenter, isLocatedStop, toSharedPlanBlocks, toSharedPlanBudget } from "./shared-plan-blocks";

type SharedPlannerViewProps = {
  shared: SharedPlan;
  token: string;
  /** Shown above the plan when it was opened from a listing, such as Explore. */
  backLink?: { href: string; label: string };
};

/**
 * A published plan, rendered by the planner itself.
 *
 * <p>The snapshot is converted to planner blocks and loaded into a store of its
 * own with {@link plannerReadOnlyAtom} set, then drawn by the same itinerary,
 * card, budget and map components the owner edits with. A change to those
 * components reaches shared plans with no second place to update. The separate
 * store also keeps the reader's own open plan out of this page and vice versa.
 */
export function SharedPlannerView(props: SharedPlannerViewProps) {
  return (
    <Provider>
      <SharedPlannerWorkspace {...props} />
    </Provider>
  );
}

function SharedPlannerWorkspace({ shared, token, backLink }: SharedPlannerViewProps) {
  const plan = shared.plan;
  const blocks = useMemo(() => toSharedPlanBlocks(plan), [plan]);
  const budget = useMemo(() => toSharedPlanBudget(plan), [plan]);
  const center = useMemo(() => getSharedPlanCenter(blocks), [blocks]);

  useHydrateAtoms([
    [plannerReadOnlyAtom, true],
    [tripBlocksAtom, blocks],
    [openBlockIdsAtom, blocks.map((block) => block.id)],
    [activeBlockIdAtom, blocks[0]?.id ?? null],
    [tripDateRangeAtom, { from: plan.startDate, to: plan.endDate }],
    [tripCurrencyAtom, getCurrencyOption(budget.currency)],
    [tripBudgetAtom, budget.amount],
    [tripExpensesAtom, budget.expenses],
  ] as const);

  const destination = [plan.destinationCity, plan.destinationCountry].filter(Boolean).join(", ");
  const title = plan.title ?? (destination || "Shared plan");
  const cover = plan.days?.flatMap((day) => day.items ?? []).find((item) => item.imageUrl)?.imageUrl;
  const hasUnlocatedStops = plan.days?.some((day) => day.items?.some((item) =>
    (item.type === "place" || item.type === "charger") && !isLocatedStop(item),
  )) ?? false;

  const renderDayAnchors = useCallback((block: TripBlockData) => {
    const index = blocks.findIndex((candidate) => candidate.id === block.id);
    const day = plan.days?.[index];
    return day ? <SharedDayAnchors startsAt={day.startsAt} endsAt={day.endsAt} /> : null;
  }, [blocks, plan.days]);

  return (
    <PlannerWorkspace
      itinerary={<>
        <TripHero destinationName={destination || title} coverImageUrl={cover} readOnly />
        <TripInfoCardShell>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="size-4" aria-hidden="true" />
              Shared plan · View only
            </p>
            {backLink && (
              <Link
                href={backLink.href}
                className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {backLink.label}
              </Link>
            )}
          </div>
          <h1 className="wrap-break-word text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-foreground">{title}</h1>
          <PlanAuthor name={shared.authorName} size="default" />
          {destination && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
              {destination}
            </p>
          )}
          {hasChargerStops(plan) && <EvPlanDisclaimer />}
          <CopySharedPlanButton token={token} hasUnlocatedStops={hasUnlocatedStops} />
        </TripInfoCardShell>

        <TripBuilderErrorBoundary>
          <ItinerarySection
            destinationName={destination || title}
            latitude={center.lat}
            longitude={center.lng}
            renderDayAnchors={renderDayAnchors}
          />
        </TripBuilderErrorBoundary>
        {plan.budget && <BudgetSection />}
      </>}
      map={<TripBuilderErrorBoundary><PlannerMap latitude={center.lat} longitude={center.lng} /></TripBuilderErrorBoundary>}
      details={null}
    >
      <DayNavSidebar />
    </PlannerWorkspace>
  );
}
