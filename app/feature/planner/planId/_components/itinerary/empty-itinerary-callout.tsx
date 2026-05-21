"use client";

import { CalendarPlus } from "lucide-react";
import { format, parseISO } from "date-fns";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyItineraryCalloutProps = {
  nextBlockDate: string | null;
  tripDateLabel: string | null;
  onAddBlock: () => void;
  onChooseDates: () => void;
};

export function EmptyItineraryCallout({
  nextBlockDate,
  tripDateLabel,
  onAddBlock,
  onChooseDates,
}: EmptyItineraryCalloutProps) {
  const canAddBlock = Boolean(nextBlockDate);
  const firstBlockLabel = nextBlockDate
    ? format(parseISO(nextBlockDate), "MMM d")
    : null;
  const heading = canAddBlock
    ? "Turn your dates into a day-by-day plan"
    : "Start by choosing your travel dates";
  const description = canAddBlock
    ? `Create your first block for ${firstBlockLabel}, then add places, notes, checklists, and charging stops as your route takes shape.`
    : "Pick a start and end date above. Navio will turn that window into itinerary blocks you can fill with stops and trip details.";

  return (
    <div className="mx-6 overflow-hidden rounded-sm border border-border/70 bg-card text-card-foreground">
      <div className="relative isolate p-6">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/10 via-transparent to-accent/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-tight text-foreground">
                  {heading}
                </h3>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>

            <button
              type="button"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-full px-6 shadow-md shadow-primary/20",
              )}
              onClick={canAddBlock ? onAddBlock : onChooseDates}
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              {canAddBlock ? "Create first block" : "Choose dates"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
