"use client";
import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { dayAutomationHistoryAtom } from "./day-automation-history";
import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { activeEvCarAtom } from "../garage/garage.atoms";
import { DayRouteOptimizer } from "./day-route-optimizer";

/** Per-day route actions under the route estimate. Auto Add lives only in the EV charging panel. */
export function DayAutomationActions({ blockId, dayNumber }: { blockId: string; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const car = useAtomValue(activeEvCarAtom);
  const [history, setHistory] = useAtom(dayAutomationHistoryAtom);
  const blocks = useAtomValue(tripBlocksAtom), setBlocks = useSetAtom(tripBlocksAtom);
  const undo = history[blockId];
  return <div className="px-3 py-2">
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={!car} onClick={() => setOpen(true)}>Optimize Route</Button>
      {undo && <Button variant="ghost" size="sm" disabled={JSON.stringify(blocks.find(b => b.id === blockId)) !== undo.after} onClick={() => { setBlocks(previous => previous.map(b => b.id === blockId ? undo.before : b)); setHistory(previous => { const next = { ...previous }; delete next[blockId]; return next; }); }}>Undo last change for this day</Button>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogTitle>Optimize Route · Day {dayNumber}</DialogTitle>
        <DialogDescription>Review route improvements before applying them to this day.</DialogDescription>
        {open && <DayRouteOptimizer blockId={blockId} />}
      </DialogContent>
    </Dialog>
  </div>;
}
