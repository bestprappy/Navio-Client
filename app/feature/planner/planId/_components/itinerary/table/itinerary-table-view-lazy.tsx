"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/** Loaded only when the table opens, so the planner does not ship the table and export code. */
export const ItineraryTableViewLazy = dynamic(
  () => import("./itinerary-table-view").then((module) => module.ItineraryTableView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col gap-4 bg-background p-6" role="status" aria-label="Loading the itinerary table">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);
