"use client";

import { Check } from "lucide-react";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { TourDefinition, TourRecords } from "./tour.types";

type TourMenuListProps = {
  heading: string;
  tours: readonly TourDefinition[];
  records: TourRecords;
  onSelect: (tour: TourDefinition) => void;
};

/** Menu rows for a set of tours: name, what it teaches, and a tick once finished. */
export function TourMenuList({ heading, tours, records, onSelect }: TourMenuListProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">{heading}</DropdownMenuLabel>
      {tours.map((tour) => {
        const done = records[tour.id]?.status === "completed" && (records[tour.id]?.version ?? 0) >= tour.version;
        return (
          <DropdownMenuItem
            key={tour.id}
            onClick={() => onSelect(tour)}
            className="items-start gap-3 rounded-md px-2 py-2"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {tour.label}
                {done ? <span className="sr-only">, finished</span> : null}
              </span>
              {tour.summary ? <span className="text-xs leading-snug text-muted-foreground">{tour.summary}</span> : null}
            </span>
            <span
              className={done ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success" : "mt-0.5 size-5 shrink-0"}
              aria-hidden="true"
            >
              {done ? <Check className="size-3.5" /> : null}
            </span>
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuGroup>
  );
}
