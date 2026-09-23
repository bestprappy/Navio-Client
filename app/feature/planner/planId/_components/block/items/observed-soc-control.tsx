"use client";

import { useId, useState } from "react";
import { useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { updatePlaceItemAtom } from "../../overview/trip-builder.atoms";

export function ObservedSocControl({ blockId, itemId, value }: { blockId: string; itemId: string; value?: number | null }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const update = useSetAtom(updatePlaceItemAtom);
  const numeric = Number(draft);
  const valid = draft.trim() !== "" && Number.isFinite(numeric) && numeric >= 0 && numeric <= 100 && Math.abs(numeric * 100 - Math.round(numeric * 100)) < 1e-8;
  return <div data-no-drag className="border-t border-border px-4 py-2 text-sm" onClick={e => e.stopPropagation()} onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}>
    <Button variant="ghost" size="sm" onClick={() => { setDraft(value == null ? "" : String(value)); setOpen(!open); }}>
      {value == null ? "Set battery level" : `Observed battery: ${value}%`}
    </Button>
    {open && <div className="space-y-2 py-2">
      <label htmlFor={id} className="block text-muted-foreground">Actual battery at this stop (%)</label>
      <input id={id} type="number" min={0} max={100} step={0.01} value={draft} onChange={e => setDraft(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
      <p className="text-xs text-muted-foreground">Updates predictions from here onward. This does not record charging.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!valid} onClick={() => { update({ blockId, itemId, updates: { observedSocCheckpoint: { socPct: numeric } } }); setOpen(false); }}>Apply battery level</Button>
        {value != null && <Button size="sm" variant="outline" onClick={() => { update({ blockId, itemId, updates: { observedSocCheckpoint: null } }); setOpen(false); }}>Clear</Button>}
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>}
  </div>;
}
