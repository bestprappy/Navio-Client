"use client";

import { type MouseEvent, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Check, MoreHorizontal, Trash2, Waypoints } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { useUpdateTripMetadata } from "@/app/feature/planner/_components/use-trip-metadata";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import { usePaletteOptions } from "../constants/use-trip-block-color";
import type { TripBlockData } from "../constants/types";
import {
  removeTripBlockAtom,
  tripBlocksAtom,
  updateBlockColorAtom,
} from "../overview/trip-builder.atoms";
import { AutoPlanDialog, useCanAutoPlan } from "../auto-plan/auto-plan-dialog";
import { getDayIndex, resolveDayAnchors } from "../itinerary/day-anchors";
import { DayTimesSection } from "../itinerary/day-times-section";
import { RecalculateTimesDialog } from "../itinerary/recalculate-times-dialog";
import { useDayTimingActions } from "../itinerary/use-day-timing-actions";
import { BlockOptionAction } from "./block-option-action";

type BlockOptionsPopoverProps = {
  block: TripBlockData;
};

function stopHeaderToggle(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

export function BlockOptionsPopover({ block }: BlockOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAutoPlanOpen, setIsAutoPlanOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const params = useParams<{ planId?: string }>();
  const blocks = useAtomValue(tripBlocksAtom);
  const removeTripBlock = useSetAtom(removeTripBlockAtom);
  const updateBlockColor = useSetAtom(updateBlockColorAtom);
  const updateMetadata = useUpdateTripMetadata(params.planId);
  const selectedColor = getTripBlockColorById(block.colorId);
  const colorOptions = usePaletteOptions();
  const isDay = block.kind !== "list";
  const dayNumber = getDayIndex(blocks, block.id);
  const startsFromAnchor = useMemo(() => Boolean(resolveDayAnchors(blocks).get(block.id)?.start), [blocks, block.id]);
  const timing = useDayTimingActions(block, startsFromAnchor);
  const canAutoPlan = useCanAutoPlan(block);
  const label = `Open options for ${block.title || "this block"}`;

  function handleDelete() {
    const { endDate } = removeTripBlock(block.id);
    setIsConfirming(false);
    setIsOpen(false);
    // The shortened range has to reach the server, or the next load rebuilds
    // the removed day from the old end date.
    if (endDate) {
      updateMetadata.mutate({ endDate });
    }
  }

  const showTimes = timing.isAvailable;
  const flagTimes = showTimes && timing.needsUpdate;

  return (
    <>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        aria-label={flagTimes ? `${label}, times need updating` : label}
        title={flagTimes ? "Times need updating" : undefined}
        onClick={stopHeaderToggle}
        onMouseDown={stopHeaderToggle}
        className="relative flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
        {/* Stale times stay noticeable while their controls live in this menu. */}
        {flagTimes ? (
          <span className="pointer-events-none absolute top-0 right-0 size-2" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-warning/70 motion-safe:animate-ping motion-reduce:hidden" />
            <span className="relative block size-2 rounded-full bg-warning ring-2 ring-card" />
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 gap-4 rounded-sm p-4"
        onClick={stopHeaderToggle}
        onMouseDown={stopHeaderToggle}
      >
        <PopoverHeader>
          <PopoverTitle>Block options</PopoverTitle>
        </PopoverHeader>

        {canAutoPlan ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <BlockOptionAction
              icon={<Waypoints />}
              title="Auto plan"
              hint="Orders your places around meals and opening hours."
              emphasis="primary"
              onClick={() => {
                // Close the menu first so the dialog is not stacked on top of it.
                setIsOpen(false);
                setIsAutoPlanOpen(true);
              }}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Change color
          </p>
          <div className="grid grid-cols-8 gap-2">
            {colorOptions.map((color) => {
              const isSelected = selectedColor.id === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  aria-label={`Use ${color.label} for ${block.title || "block"}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full shadow-xs ring-offset-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                    isSelected && "ring-2 ring-foreground/20",
                  )}
                  style={{
                    backgroundColor: color.value,
                    color: color.foreground,
                  }}
                  onClick={() =>
                    updateBlockColor({ blockId: block.id, colorId: color.id })
                  }
                >
                  {isSelected ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {showTimes ? <DayTimesSection timing={timing} onReviewOpen={() => setIsOpen(false)} /> : null}

        {isConfirming ? (
          <div className="space-y-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs leading-relaxed text-foreground">
              {isDay
                ? `Remove day ${dayNumber}? Later days each move one day earlier and the trip ends a day sooner, so the itinerary stays in an unbroken run.`
                : "Delete this list and everything in it?"}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="flex-1 rounded-sm"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {isDay ? "Remove day" : "Delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm"
                onClick={() => setIsConfirming(false)}
              >
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full justify-start rounded-sm p-4"
            onClick={() => setIsConfirming(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {isDay ? "Remove this day" : "Delete this block"}
          </Button>
        )}
      </PopoverContent>
    </Popover>
    {/* Outside the menu, so they stay open after the menu closes. */}
    {showTimes ? <RecalculateTimesDialog {...timing.replaceDialog} /> : null}
    <AutoPlanDialog block={block} open={isAutoPlanOpen} onOpenChange={setIsAutoPlanOpen} finalFocus={triggerRef} />
    </>
  );
}
