"use client";
import { useId } from "react";
import { useAtom } from "jotai";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { batteryThresholdPctAtom, minimumArrivalPctAtom } from "../garage/garage.atoms";

function PercentageControl({ label, description, value, onChange, disabled }: { label: string; description: string; value: number; onChange: (value: number) => void; disabled: boolean }) {
  const id = useId();
  return <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium">{label} (%)</label>
    <p id={`${id}-help`} className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    <div className="flex items-center gap-4">
      <Slider min={1} max={100} step={1} value={value} disabled={disabled} onValueChange={v => onChange(Array.isArray(v) ? v[0] : v)} getAriaLabel={() => label} getAriaValueText={v => `${v}%`} />
      <div className="flex shrink-0 items-center gap-1"><Input id={id} type="number" min={1} max={100} step={1} value={value} disabled={disabled} aria-describedby={`${id}-help`} className="w-20 tabular-nums" onChange={event => { const v = event.target.valueAsNumber; if (Number.isFinite(v)) onChange(Math.max(1, Math.min(100, Math.round(v)))); }} /><span aria-hidden="true">%</span></div>
    </div>
  </div>;
}
export function ChargingPreferences({ disabled = false }: { disabled?: boolean }) {
  const [threshold, setThreshold] = useAtom(batteryThresholdPctAtom);
  const [arrival, setArrival] = useAtom(minimumArrivalPctAtom);
  return <details className="mt-3 rounded-sm border border-border bg-background p-3">
    <summary className="cursor-pointer text-sm font-medium focus-visible:outline-ring">Auto Add settings · {threshold}% / {arrival}%</summary>
    <div className="mt-4 space-y-4" data-tour="planner.ev-reserve">
      <PercentageControl label="Battery Threshold" description="Automatically add a charging stop when your battery is predicted to fall below this level." value={threshold} onChange={setThreshold} disabled={disabled} />
      <PercentageControl label="Minimum Arrival Battery" description="Ensure your vehicle reaches the final destination of the selected day with at least this much battery remaining." value={arrival} onChange={setArrival} disabled={disabled} />
      <p data-tour="planner.ev-charge-target" className="text-xs text-muted-foreground">New stops charge to 100%. Adjust each stop individually after adding it. Compatible EV connectors are used.</p>
    </div>
  </details>;
}
