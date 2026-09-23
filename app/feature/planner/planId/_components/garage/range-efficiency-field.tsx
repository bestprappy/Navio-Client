"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { consumptionForRange, estimateRealWorldRange, rangeForConsumption } from "./vehicle-mappers";

type EntryMode = "range" | "consumption";

const MODE_OPTIONS: { value: EntryMode; label: string }[] = [
  { value: "range", label: "Range" },
  { value: "consumption", label: "kWh/100 km" },
];

type RangeEfficiencyFieldProps = {
  id: string;
  batteryKwh: number;
  officialRangeKm: number;
  /** Test standard of the official range; custom vehicles have none, so no estimate is offered. */
  rangeStandard?: string;
  /** Consumption in kWh/100 km as typed text; the planner stores consumption only. */
  consumption: string;
  onConsumptionChange: (consumption: string) => void;
  disabled?: boolean;
};

/**
 * How far the car really goes, entered either as full-charge range or as average consumption.
 * Both describe the same number (range = battery ÷ consumption), so the planner keeps storing consumption.
 */
export function RangeEfficiencyField({
  id, batteryKwh, officialRangeKm, rangeStandard, consumption, onConsumptionChange, disabled = false,
}: RangeEfficiencyFieldProps) {
  const [mode, setMode] = useState<EntryMode>("range");
  const [rangeText, setRangeText] = useState(() => rangeTextFor(batteryKwh, consumption));
  const helpId = `${id}-help`;

  const estimate = estimateRealWorldRange(officialRangeKm, rangeStandard);
  const estimateConsumption = estimate ? consumptionForRange(batteryKwh, officialRangeKm * estimate.factor) : null;
  const consumptionValue = Number(consumption);
  const planningRangeKm = consumptionValue > 0 ? rangeForConsumption(batteryKwh, consumptionValue) : null;
  const usingEstimate = estimateConsumption !== null && Math.abs(consumptionValue - estimateConsumption) < 0.06; // earlier estimates were saved at 0.1 precision

  function changeMode(next: EntryMode) {
    if (next === "range") setRangeText(rangeTextFor(batteryKwh, consumption));
    setMode(next);
  }

  function changeRange(text: string) {
    setRangeText(text);
    const km = Number(text);
    onConsumptionChange(text !== "" && km > 0 ? String(consumptionForRange(batteryKwh, km)) : "");
  }

  function applyEstimate() {
    if (estimateConsumption === null) return;
    onConsumptionChange(String(estimateConsumption));
    setRangeText(rangeTextFor(batteryKwh, String(estimateConsumption)));
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {mode === "range" ? "Range on a full charge" : "Average consumption"}
        </label>
        <div role="group" aria-label="Enter as" className="inline-flex shrink-0 rounded-md bg-muted p-0.5">
          {MODE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={disabled}
              onClick={() => changeMode(value)}
              className={cn(
                "rounded-sm px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
                mode === value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="relative w-full max-w-44">
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            required
            min={mode === "range" ? "1" : "0.001"}
            max={mode === "range" ? "99999" : "99999.999"}
            step={mode === "range" ? "1" : "0.001"}
            value={mode === "range" ? rangeText : consumption}
            onChange={(event) => (mode === "range" ? changeRange(event.target.value) : onConsumptionChange(event.target.value))}
            disabled={disabled}
            aria-describedby={helpId}
            className="pr-24 tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {mode === "range" ? "km" : "kWh/100 km"}
          </span>
        </div>
        {/* The same figure in the other unit, so either input stays meaningful. */}
        <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {mode === "range"
            ? consumptionValue > 0 && `${consumptionValue.toFixed(1)} kWh/100 km`
            : planningRangeKm !== null && `About ${planningRangeKm.toLocaleString("en-US")} km on a full charge`}
        </p>
      </div>

      <RangeRuler planningRangeKm={planningRangeKm} officialRangeKm={officialRangeKm} officialLabel={rangeStandard ?? "Declared"} />

      <div className="grid justify-items-start gap-1">
        <p id={helpId} className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          {estimate === null
            ? "Use what your car actually gets. Charging stops are planned from this figure."
            : usingEstimate
              ? `Estimated from the ${officialRangeKm} km ${rangeStandard} figure × ${estimate.factor.toFixed(2)}, because lab tests run slower and without air-con. If you know what your car really gets, enter it.`
              : `Your own figure. The official ${rangeStandard} range is ${officialRangeKm} km; the estimate for real roads is about ${estimate.km} km.`}
        </p>
        {estimate !== null && !usingEstimate && (
          <Button type="button" variant="ghost" size="sm" className="-ml-2 gap-1.5" disabled={disabled} onClick={applyEstimate}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Use estimate
          </Button>
        )}
      </div>
    </div>
  );
}

/** A scale from zero: the filled bar is the range used for planning, the tick is the official test figure. */
function RangeRuler({ planningRangeKm, officialRangeKm, officialLabel }: { planningRangeKm: number | null; officialRangeKm: number; officialLabel: string }) {
  if (planningRangeKm === null || !(officialRangeKm > 0)) return null;
  const scaleKm = Math.max(planningRangeKm, officialRangeKm) * 1.08;
  const planningPct = (planningRangeKm / scaleKm) * 100;
  const officialPct = (officialRangeKm / scaleKm) * 100;

  return (
    <div aria-hidden="true" className="pt-1 pb-5">
      <div className="relative h-2 rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200" style={{ width: `${planningPct}%` }} />
        <div className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60" style={{ left: `${officialPct}%` }} />
        {/* Anchor the label's edge to the tick so it never runs past the track. */}
        <span
          className="absolute top-4 whitespace-nowrap text-xs text-muted-foreground tabular-nums"
          style={officialPct >= 50 ? { right: `${100 - officialPct}%` } : { left: `${officialPct}%` }}
        >
          {officialLabel} {officialRangeKm} km
        </span>
      </div>
    </div>
  );
}

function rangeTextFor(batteryKwh: number, consumption: string): string {
  const value = Number(consumption);
  return value > 0 ? String(rangeForConsumption(batteryKwh, value)) : "";
}
