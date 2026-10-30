"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PlannerEmptyState } from "../layout/planner-empty-state";

type GarageEmptyStateProps = {
  disabled: boolean;
  onAddVehicle: () => void;
};

type PreviewDay = {
  label: string;
  arrivalPercent: number;
};

/** Illustrative arrival charge per day; low days use the warning tone like the real overview. */
const PREVIEW_DAYS: readonly PreviewDay[] = [
  { label: "Day 1", arrivalPercent: 72 },
  { label: "Day 2", arrivalPercent: 28 },
  { label: "Day 3", arrivalPercent: 64 },
];

const LOW_BATTERY_PERCENT = 30;

export function GarageEmptyState({ disabled, onAddVehicle }: GarageEmptyStateProps) {
  return (
    <PlannerEmptyState.Root className="mx-1">
      <PlannerEmptyState.Body>
        <PlannerEmptyState.Title>Add the EV you&apos;re driving</PlannerEmptyState.Title>
        <PlannerEmptyState.Description>
          See how much battery each day uses and how long you&apos;ll need to
          charge along the way.
        </PlannerEmptyState.Description>
        <PlannerEmptyState.Action>
          <Button type="button" size="lg" className="gap-2" disabled={disabled} onClick={onAddVehicle}>
            <Plus className="size-4" aria-hidden="true" />
            Add vehicle
          </Button>
        </PlannerEmptyState.Action>
      </PlannerEmptyState.Body>

      <PlannerEmptyState.Preview>
        <ul className="grid gap-2.5 px-1 py-1.5">
          {PREVIEW_DAYS.map(({ label, arrivalPercent }) => {
            const low = arrivalPercent <= LOW_BATTERY_PERCENT;
            return (
              <li key={label} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-card ring-1 ring-border">
                  <span
                    className={cn("block h-full rounded-full", low ? "bg-warning" : "bg-primary/70")}
                    style={{ width: `${arrivalPercent}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "w-8 shrink-0 text-right text-xs tabular-nums",
                    low ? "text-warning" : "text-muted-foreground",
                  )}
                >
                  {arrivalPercent}%
                </span>
              </li>
            );
          })}
        </ul>
      </PlannerEmptyState.Preview>
    </PlannerEmptyState.Root>
  );
}
