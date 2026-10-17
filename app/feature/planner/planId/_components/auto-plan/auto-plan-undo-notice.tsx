"use client";

import { Undo2, X } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import { getDayIndex } from "../itinerary/day-anchors";
import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { autoPlanUndoAtom, canUndoAutoPlan, dismissDayAutoPlanAtom, undoDayAutoPlanAtom } from "./auto-plan.atoms";

/** Confirms what Auto plan did, with Undo until the day is edited again. */
export function AutoPlanUndoNotice({ blockId }: { blockId: string }) {
  const blocks = useAtomValue(tripBlocksAtom);
  const undo = useAtomValue(autoPlanUndoAtom)[blockId];
  const undoPlan = useSetAtom(undoDayAutoPlanAtom);
  const dismiss = useSetAtom(dismissDayAutoPlanAtom);
  if (!undo || !canUndoAutoPlan(blocks, undo)) return null;

  const moved = undo.movedCount && undo.movedTo
    ? ` ${undo.movedCount === 1 ? "1 place" : `${undo.movedCount} places`} moved to day ${getDayIndex(blocks, undo.movedTo)}.`
    : "";
  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary/10 py-1 pr-1 pl-3" onClick={(event) => event.stopPropagation()}>
      <p role="status" className="min-w-0 flex-1 text-sm text-foreground">
        Day planned with {undo.stopCount} {undo.stopCount === 1 ? "stop" : "stops"}.{moved}
      </p>
      <Button type="button" variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary" onClick={() => undoPlan(blockId)}>
        <Undo2 aria-hidden="true" />
        Undo
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={() => dismiss(blockId)}>
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
