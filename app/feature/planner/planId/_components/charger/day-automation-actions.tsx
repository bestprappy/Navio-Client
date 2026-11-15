"use client";
import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { dayAutomationHistoryAtom } from "./day-automation-history";
import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { activeEvCarAtom, startingBatteryPctAtom, batteryThresholdPctAtom, minimumArrivalPctAtom } from "../garage/garage.atoms";
import { useTripCharging } from "../garage/use-trip-charging";
import { EvRouteOptimizationPanel } from "./ev-route-optimization-panel";
import { DayRouteOptimizer } from "./day-route-optimizer";

export function DayAutomationActions({ blockId, dayNumber }: { blockId: string; dayNumber: number }) {
  const [action, setAction] = useState<"auto" | "optimize" | null>(null);
  const car = useAtomValue(activeEvCarAtom), initial = useAtomValue(startingBatteryPctAtom);
  const threshold = useAtomValue(batteryThresholdPctAtom), minimum = useAtomValue(minimumArrivalPctAtom);
  const charging = useTripCharging();
  const [history, setHistory] = useAtom(dayAutomationHistoryAtom);
  const blocks = useAtomValue(tripBlocksAtom), setBlocks = useSetAtom(tripBlocksAtom);
  const undo = history[blockId];
  const day = charging?.days.get(blockId);
  const states = day ? [...day.batteryByItemId.values()] : [];
  const satisfied = states.length > 1 && states.every(s => s.distanceQuality === "ROUTED" && s.rawPredictedArrivalSocPct !== null) && states.slice(1).every(s => s.rawPredictedArrivalSocPct! >= threshold) && states.at(-1)!.rawPredictedArrivalSocPct! >= minimum;
  return <div className="px-3 py-2">
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={!car || satisfied} onClick={() => setAction("auto")}>Auto Add</Button>
      <Button variant="outline" size="sm" disabled={!car} onClick={() => setAction("optimize")}>Optimize Route</Button>
      <Button variant="ghost" size="sm" onClick={() => setAction("auto")}>Charging settings</Button>
    </div>
    {undo && <Button variant="ghost" size="sm" disabled={JSON.stringify(blocks.find(b => b.id === blockId)) !== undo.after} onClick={() => { setBlocks(previous => previous.map(b => b.id === blockId ? undo.before : b)); setHistory(previous => { const next = { ...previous }; delete next[blockId]; return next; }); }}>Undo last change for this day</Button>}
    {satisfied && <p className="mt-2 text-xs text-muted-foreground">No additional charging stops are needed for this day.</p>}
    <Dialog open={action !== null} onOpenChange={open => { if (!open) setAction(null); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogTitle>{action === "optimize" ? "Optimize Route" : "Auto Add"} · Day {dayNumber}</DialogTitle>
        <DialogDescription>{action === "optimize" ? "Review route improvements before applying them to this day." : "Insert necessary compatible charging stops while preserving your itinerary."}</DialogDescription>
        {action === "auto" && <EvRouteOptimizationPanel blockId={blockId} vehicle={car} startingSocPct={day?.startBatteryPct ?? initial} showOptimizer={false} onOpenVehicleSettings={() => setAction(null)} />}
        {action === "optimize" && <DayRouteOptimizer blockId={blockId} />}
      </DialogContent>
    </Dialog>
  </div>;
}
