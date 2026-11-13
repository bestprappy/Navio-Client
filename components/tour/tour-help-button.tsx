"use client";

import type { MouseEvent } from "react";
import { useAtomValue } from "jotai";
import { CircleHelp } from "lucide-react";

import { notify } from "@/components/toast/notify";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pageTourAtom } from "./tour.atoms";
import { useTour } from "./use-tour";

type TourHelpButtonProps = {
  /** `row` matches the app sidebar's account actions; `icon` fits a toolbar. */
  variant?: "row" | "icon";
  /** Sidebar is collapsed to icons only. */
  collapsed?: boolean;
  className?: string;
  /** Called before the tour starts, for example to close a mobile menu. */
  onStart?: () => void;
};

const LABEL = "Show tips for this page";

/**
 * Replays the current page's tour. Renders nothing on pages without one, so it
 * can sit in shared navigation.
 */
export function TourHelpButton({ variant = "row", collapsed = false, className, onStart }: TourHelpButtonProps) {
  const pageTour = useAtomValue(pageTourAtom);
  const { activeTourId, start } = useTour();
  if (!pageTour) return null;

  // Not disabled while a tour runs: the overlay already blocks it, and focus must be able to return here.
  const isRunning = activeTourId !== null;
  const isDisabled = !pageTour.ready;
  const accessibleLabel = `${LABEL}: ${pageTour.tour.label}`;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!pageTour || isRunning) return;
    const { tour, prepare } = pageTour;
    const opener = event.currentTarget;
    onStart?.();
    prepare?.();
    // Let anything onStart closed (a phone menu) leave the screen before targets are measured.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        void start(tour, opener)
          .then((result) => {
            if (result === "too-few-targets") {
              console.warn(`TourHelpButton: the ${tour.id} tour has too few controls on screen to run`);
              notify.info({ title: "Tips aren't available here yet", description: "Wait for the page to finish loading, then try again." });
            } else if (result === "failed") {
              notify.error({ title: "Tips didn't open", description: "Refresh the page and try again." });
            }
          })
          .catch((error: unknown) => console.error(`TourHelpButton: the ${tour.id} tour failed to start`, error));
      }),
    );
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        data-tour="help"
        aria-label={accessibleLabel}
        title={LABEL}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn("rounded-full text-muted-foreground hover:text-foreground", className)}
      >
        <CircleHelp className="size-5" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      data-tour="help"
      aria-label={accessibleLabel}
      title={collapsed ? LABEL : undefined}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        "flex min-h-11 w-full items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        className,
      )}
    >
      <CircleHelp className="size-5 shrink-0" aria-hidden="true" />
      {!collapsed && "Show tips"}
    </button>
  );
}
