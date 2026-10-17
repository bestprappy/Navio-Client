"use client";

import { useId } from "react";
import { AlertTriangle, CalendarClock, ListRestart, Loader2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BlockOptionAction } from "../block/block-option-action";

import type { DayTimingActions } from "./use-day-timing-actions";

/** The day's time actions, shown inside Block options. */
export function DayTimesSection({ timing, onReviewOpen }: {
  timing: DayTimingActions;
  /** Closes the menu so the review dialog is not stacked on top of it. */
  onReviewOpen: () => void;
}) {
  const headingId = useId();
  const { status, needsUpdate, isWaitingForRoutes } = timing;
  // Needs-updating lives beside the heading; the line below answers actions and explains problems.
  const message = needsUpdate || status.tone === "idle" ? null : status;

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 id={headingId} className="text-xs font-semibold text-muted-foreground">Times</h4>
        {needsUpdate ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-foreground">
            <AlertTriangle className="size-3 text-warning" aria-hidden="true" />
            Needs updating
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
        <BlockOptionAction
          icon={<CalendarClock />}
          title="Calculate times"
          hint="Keeps fixed times."
          emphasis={needsUpdate ? "strong" : "primary"}
          disabled={isWaitingForRoutes}
          onClick={timing.calculate}
        />
        <BlockOptionAction
          icon={<ListRestart />}
          title="Recalculate all times"
          hint="Replaces your times after review."
          emphasis="neutral"
          disabled={isWaitingForRoutes}
          onClick={() => {
            if (timing.recalculateAll() === "review") onReviewOpen();
          }}
        />
      </div>

      <div role="status" aria-live="polite" className={cn("flex min-h-0 items-center justify-between gap-2", message && "min-h-7")}>
        {needsUpdate ? <span className="sr-only">Times need updating</span> : null}
        {message ? (
          <span className={cn(
            "flex min-w-0 items-center gap-1.5 text-xs leading-snug",
            message.tone === "warning" ? "text-foreground" : "text-muted-foreground",
            message.tone === "done" && "text-foreground",
          )}>
            {message.tone === "loading" ? <Loader2 className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
            {message.tone === "warning" ? <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden="true" /> : null}
            {message.text}
          </span>
        ) : null}
        {timing.canUndo ? (
          <Button type="button" variant="ghost" size="xs" className="shrink-0 text-primary" onClick={timing.undoCalculation}>
            <Undo2 aria-hidden="true" />
            Undo
          </Button>
        ) : null}
      </div>
    </section>
  );
}
