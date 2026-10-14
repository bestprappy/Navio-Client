"use client";

import { type CSSProperties, type RefObject, useMemo } from "react";
import { useAtomValue } from "jotai";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import type { TripBlockData } from "../constants/types";
import { resolveDayAnchors } from "../itinerary/day-anchors";
import { plannerReadOnlyAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";
import { autoPlanRefineAtom } from "./auto-plan.atoms";
import { AutoPlanRoot, useAutoPlanContext } from "./auto-plan-context";
import { AutoPlanSettings } from "./auto-plan-settings";
import { AutoPlanLoading, AutoPlanSummary, AutoPlanTimeline } from "./auto-plan-timeline";
import { AutoPlanTimeRefiner } from "./auto-plan-time-refiner";
import { AutoPlanNotes, AutoPlanUnplanned } from "./auto-plan-unplanned";

function AutoPlanEmpty() {
  const { canPlan, isLoading, dayNumber } = useAutoPlanContext();
  if (canPlan || isLoading) return null;
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-foreground">Add at least two places to day {dayNumber}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Add places from a guide or by searching the map. Auto plan then puts them in a good order for the day.
      </p>
    </div>
  );
}

function AutoPlanBody() {
  const { canPlan } = useAutoPlanContext();
  if (!canPlan) return <div className="min-h-0 overflow-y-auto p-5"><AutoPlanEmpty /><AutoPlanLoading /></div>;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:overflow-hidden">
      <div className="border-b border-border bg-muted/25 p-5 md:overflow-y-auto md:border-r md:border-b-0 md:p-6">
        <AutoPlanSettings />
      </div>
      <section className="min-w-0 space-y-6 p-5 md:overflow-y-auto md:overscroll-contain md:p-6" aria-label="Plan preview">
        <AutoPlanLoading />
        <AutoPlanSummary />
        <AutoPlanTimeline />
        <AutoPlanUnplanned />
        <AutoPlanNotes />
      </section>
    </div>
  );
}

function AutoPlanFooter({ onApplied }: { onApplied: () => void }) {
  const { canPlan, plan, applyError, apply } = useAutoPlanContext();
  return (
    <div className="shrink-0 border-t border-border px-5 py-4 md:px-6">
      {applyError ? <p role="alert" className="text-sm text-destructive">{applyError}</p> : null}
      <DialogFooter className="m-0 flex-row items-center rounded-none border-0 bg-transparent p-0">
        <p className="mr-auto hidden text-xs text-muted-foreground sm:block">Nothing changes until you apply.</p>
        <DialogClose render={<Button type="button" variant="outline" className="h-10 flex-1 px-4 sm:flex-none" />}>{canPlan ? "Cancel" : "Close"}</DialogClose>
        {canPlan ? (
          <Button type="button" className="h-10 flex-1 px-5 sm:flex-none" disabled={!plan?.stops.length} onClick={() => { if (apply()) onApplied(); }}>Apply plan</Button>
        ) : null}
      </DialogFooter>
    </div>
  );
}

/** Whether this day can be auto planned here: an itinerary day the traveller can edit. */
export function useCanAutoPlan(block: TripBlockData) {
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  return !readOnly && block.kind === "itinerary";
}

type AutoPlanDialogProps = {
  block: TripBlockData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where focus goes when the dialog closes; the menu that opened it is gone by then. */
  finalFocus?: RefObject<HTMLElement | null>;
};

/**
 * A preview of the day's places in a better order; nothing changes until Apply plan.
 * Opened from Block options, so it lives outside that menu and stays open after it closes.
 */
export function AutoPlanDialog({ block, open, onOpenChange, finalFocus }: AutoPlanDialogProps) {
  const canAutoPlan = useCanAutoPlan(block);
  const blocks = useAtomValue(tripBlocksAtom);
  const isRefining = useAtomValue(autoPlanRefineAtom)[block.id] === block.items;
  const startsFromAnchor = useMemo(() => Boolean(resolveDayAnchors(blocks).get(block.id)?.start), [blocks, block.id]);
  if (!canAutoPlan) return null;

  const color = getTripBlockColorById(block.colorId);
  // The dialog renders outside the day, so it carries the day's colour with it.
  const dayColor: CSSProperties & Record<`--${string}`, string> = {
    "--primary": color.value,
    "--primary-foreground": color.foreground,
    "--ring": color.value,
  };

  return (
    <>
      {isRefining ? <AutoPlanTimeRefiner block={block} startsFromAnchor={startsFromAnchor} /> : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          style={dayColor}
          finalFocus={finalFocus}
          className="flex max-h-[calc(100dvh-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl md:h-[min(48rem,calc(100dvh-3rem))] md:max-w-[54rem]"
          // Planner shortcuts must not fire while typing times in the dialog.
          onKeyDown={(event) => event.stopPropagation()}
        >
          {open ? (
            <AutoPlanRoot block={block}>
              <AutoPlanHeader />
              <AutoPlanBody />
              <AutoPlanFooter onApplied={() => onOpenChange(false)} />
            </AutoPlanRoot>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AutoPlanHeader() {
  const { dayNumber, weekday } = useAutoPlanContext();
  return (
    <DialogHeader className="shrink-0 gap-2 border-b border-border px-5 py-5 pr-12 md:px-6 md:pr-12">
      <DialogTitle className="text-xl leading-snug font-semibold tracking-tight">Auto plan <span className="font-normal text-muted-foreground">day {dayNumber}{weekday ? `, ${weekday}` : ""}</span></DialogTitle>
      <DialogDescription className="max-w-xl text-xs leading-relaxed sm:text-sm">
        Group nearby places and make room for meals and opening hours. Review your day before applying.
      </DialogDescription>
    </DialogHeader>
  );
}
