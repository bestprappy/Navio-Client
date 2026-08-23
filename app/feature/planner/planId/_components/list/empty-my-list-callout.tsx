"use client";

import { ListPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyMyListCalloutProps = {
  onCreateList: () => void;
};

export function EmptyMyListCallout({ onCreateList }: EmptyMyListCalloutProps) {
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

        <div className="space-y-4">
          <h3 className="text-xl font-bold leading-tight text-foreground">
            Save places as you plan
          </h3>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Create a list to organise your must-sees, restaurants, charging
            stops, or anything worth revisiting along the way.
          </p>

          <button
            type="button"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 rounded-full px-6 shadow-md shadow-primary/20",
            )}
            onClick={onCreateList}
          >
            <ListPlus className="size-4" aria-hidden="true" />
            Create a list
          </button>
        </div>
      </div>
    </div>
  );
}
