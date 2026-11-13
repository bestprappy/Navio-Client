"use client";

import { useRef } from "react";
import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TourMenuList } from "./tour-menu-list";
import type { TourDefinition } from "./tour.types";
import { useRequestTour } from "./use-request-tour";
import { useTour } from "./use-tour";

type SectionTourButtonProps = {
  /** Section name for the accessible label, for example "Itinerary". */
  section: string;
  tours: readonly TourDefinition[];
  /** Runs before a tour starts so its controls are on screen. */
  prepare?: () => void;
  className?: string;
};

/**
 * A small "?" beside a section heading. One tour starts straight away; several
 * open a short menu. A dot turns green once every tour here is finished, so
 * the planner doubles as a map of what is left to learn.
 */
export function SectionTourButton({ section, tours, prepare, className }: SectionTourButtonProps) {
  const { readRecords } = useTour();
  const { isTourRunning, requestTour } = useRequestTour();
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (tours.length === 0) return null;

  const records = readRecords();
  const allDone = tours.every((tour) => records[tour.id]?.status === "completed" && (records[tour.id]?.version ?? 0) >= tour.version);
  const label = `Tips for ${section}${allDone ? ", all finished" : ""}`;
  const buttonClass = cn(
    "relative size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground",
    className,
  );
  const face = (
    <>
      <CircleHelp className="size-4.5" aria-hidden="true" />
      {allDone ? (
        <span className="absolute right-1 top-1 size-2 rounded-full bg-success ring-2 ring-card" aria-hidden="true" />
      ) : null}
    </>
  );

  function run(tour: TourDefinition, opener: HTMLElement | null) {
    if (isTourRunning) return;
    requestTour(tour, { opener, prepare });
  }

  if (tours.length === 1) {
    const [only] = tours;
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        title={`Tips for ${section}`}
        onClick={(event) => run(only, event.currentTarget)}
        className={buttonClass}
      >
        {face}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        ref={triggerRef}
        aria-label={label}
        title={`Tips for ${section}`}
        render={<Button type="button" variant="ghost" size="icon" className={buttonClass} />}
      >
        {face}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-1.5">
        <TourMenuList
          heading={`Tips for ${section}`}
          tours={tours}
          records={records}
          onSelect={(tour) => run(tour, triggerRef.current)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
