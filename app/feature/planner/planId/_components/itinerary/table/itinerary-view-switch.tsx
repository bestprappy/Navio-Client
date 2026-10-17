"use client";

import { Map as MapIcon, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { useItineraryView, type ItineraryView } from "./use-itinerary-view";

const VIEWS: { id: ItineraryView; label: string; Icon: typeof MapIcon }[] = [
  { id: "plan", label: "Plan", Icon: MapIcon },
  { id: "table", label: "Table", Icon: Table2 },
];

/** Switches the itinerary between the cards-and-map plan and the full-width table. */
export function ItineraryViewSwitch({ className }: { className?: string }) {
  const [view, setView] = useItineraryView();
  return (
    <div role="group" aria-label="Itinerary view" className={cn("flex items-end gap-1", className)}>
      {VIEWS.map(({ id, label, Icon }) => {
        const isCurrent = view === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isCurrent}
            onClick={() => setView(id)}
            className={cn(
              "relative flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              // The underline marks the open view, like a tab, without relying on colour alone.
              "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full",
              isCurrent
                ? "font-semibold text-foreground after:bg-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground after:bg-transparent",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
