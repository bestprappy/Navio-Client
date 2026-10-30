"use client";

import { Landmark, ListPlus, UtensilsCrossed, Zap, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PlannerEmptyState } from "../layout/planner-empty-state";

type EmptyMyListCalloutProps = {
  onCreateList: () => void;
};

type PreviewPlace = {
  icon: LucideIcon;
  label: string;
  barWidth: string;
};

const PREVIEW_PLACES: readonly PreviewPlace[] = [
  { icon: Landmark, label: "Must-see", barWidth: "w-3/4" },
  { icon: UtensilsCrossed, label: "Restaurant", barWidth: "w-1/2" },
  { icon: Zap, label: "Charging stop", barWidth: "w-2/3" },
];

export function EmptyMyListCallout({ onCreateList }: EmptyMyListCalloutProps) {
  return (
    <PlannerEmptyState.Root className="mx-6">
      <PlannerEmptyState.Body>
        <PlannerEmptyState.Title>Save places as you plan</PlannerEmptyState.Title>
        <PlannerEmptyState.Description>
          Collect must-sees, restaurants and charging stops in one list
          while you work out the days.
        </PlannerEmptyState.Description>
        <PlannerEmptyState.Action>
          <Button type="button" size="lg" className="gap-2" onClick={onCreateList}>
            <ListPlus className="size-4" aria-hidden="true" />
            Create a list
          </Button>
        </PlannerEmptyState.Action>
      </PlannerEmptyState.Body>

      <PlannerEmptyState.Preview>
        <ul className="grid gap-1.5">
          {PREVIEW_PLACES.map(({ icon: Icon, label, barWidth }, index) => (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2.5 rounded-sm bg-card px-2.5 py-2",
                index === PREVIEW_PLACES.length - 1 && "opacity-60",
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
                <Icon className="size-3.5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-foreground/80">{label}</span>
                <span className={cn("h-1.5 rounded-full bg-muted-foreground/20", barWidth)} />
              </span>
            </li>
          ))}
        </ul>
      </PlannerEmptyState.Preview>
    </PlannerEmptyState.Root>
  );
}
