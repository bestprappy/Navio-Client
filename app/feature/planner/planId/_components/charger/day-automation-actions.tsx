"use client";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { dayAutomationHistoryAtom } from "./day-automation-history";
import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { Button } from "@/components/ui/button";

/** Undo for the day's last Auto Add, shown under the route estimate only after Auto Add changed the day. */
export function DayAutomationActions({ blockId }: { blockId: string }) {
  const [history, setHistory] = useAtom(dayAutomationHistoryAtom);
  const blocks = useAtomValue(tripBlocksAtom), setBlocks = useSetAtom(tripBlocksAtom);
  const undo = history[blockId];
  if (!undo) return null;
  const changedSince = JSON.stringify(blocks.find(b => b.id === blockId)) !== undo.after;
  return <div className="px-3 py-2">
    <Button variant="ghost" size="sm" disabled={changedSince} onClick={() => {
      setBlocks(previous => previous.map(b => b.id === blockId ? undo.before : b));
      setHistory(previous => { const next = { ...previous }; delete next[blockId]; return next; });
    }}>Undo last change for this day</Button>
  </div>;
}
