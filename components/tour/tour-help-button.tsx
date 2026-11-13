"use client";

import { useRef, type ReactNode } from "react";
import { useAtomValue } from "jotai";
import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { pageToursAtom, type PageTourRegistration } from "./tour.atoms";
import { TourMenuList } from "./tour-menu-list";
import { useRequestTour } from "./use-request-tour";
import { useTour } from "./use-tour";

type TourHelpButtonProps = {
  /** `row` matches the app sidebar's account actions; `icon` fits a toolbar. */
  variant?: "row" | "icon";
  /** Sidebar is collapsed to icons only. */
  collapsed?: boolean;
  className?: string;
  /** Called before a tour starts, for example to close a mobile menu. */
  onStart?: () => void;
};

const LABEL = "Show tips for this page";
const ROW_CLASS =
  "flex min-h-11 w-full items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 data-popup-open:bg-muted data-popup-open:text-foreground";

/**
 * Replays the page's tours. With one tour it starts it straight away; with
 * several (the planner) it lists them, ticking the finished ones. Renders
 * nothing on pages without tours, so it can sit in shared navigation.
 */
export function TourHelpButton({ variant = "row", collapsed = false, className, onStart }: TourHelpButtonProps) {
  const registrations = useAtomValue(pageToursAtom);
  const { readRecords } = useTour();
  const { isTourRunning, requestTour } = useRequestTour();
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (registrations.length === 0) return null;

  const isDisabled = registrations.every((entry) => !entry.ready);
  const pageLabel = registrations.find((entry) => entry.autoStart)?.tour.label ?? registrations[0].tour.label;
  const accessibleLabel = `${LABEL}: ${pageLabel}`;

  function run(entry: PageTourRegistration, opener: HTMLElement | null) {
    if (isTourRunning) return;
    requestTour(entry.tour, {
      opener,
      prepare: () => {
        onStart?.();
        entry.prepare?.();
      },
    });
  }

  const face: ReactNode =
    variant === "icon" ? (
      <CircleHelp className="size-5" aria-hidden="true" />
    ) : (
      <>
        <CircleHelp className="size-5 shrink-0" aria-hidden="true" />
        {!collapsed && "Show tips"}
      </>
    );

  const iconClass = cn("rounded-full text-muted-foreground hover:text-foreground", className);
  const rowClass = cn(ROW_CLASS, collapsed ? "justify-center px-0" : "gap-3 px-3", className);

  if (registrations.length === 1) {
    const [only] = registrations;
    return variant === "icon" ? (
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        data-tour="help"
        aria-label={accessibleLabel}
        title={LABEL}
        disabled={isDisabled}
        onClick={(event) => run(only, event.currentTarget)}
        className={iconClass}
      >
        {face}
      </Button>
    ) : (
      <button
        type="button"
        data-tour="help"
        aria-label={accessibleLabel}
        title={collapsed ? LABEL : undefined}
        disabled={isDisabled}
        onClick={(event) => run(only, event.currentTarget)}
        className={rowClass}
      >
        {face}
      </button>
    );
  }

  const records = readRecords();
  const tours = registrations.map((entry) => entry.tour);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        ref={triggerRef}
        data-tour="help"
        aria-label={accessibleLabel}
        title={collapsed || variant === "icon" ? LABEL : undefined}
        disabled={isDisabled}
        render={variant === "icon" ? <Button type="button" variant="ghost" size="icon-lg" className={iconClass} /> : <button type="button" className={rowClass} />}
      >
        {face}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={variant === "icon" ? "bottom" : "right"} align="end" className="w-72 p-1.5">
        <TourMenuList
          heading={`Tips for the ${pageLabel.toLowerCase()}`}
          tours={tours}
          records={records}
          onSelect={(tour) => {
            const entry = registrations.find((candidate) => candidate.tour.id === tour.id);
            if (entry) run(entry, triggerRef.current);
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
