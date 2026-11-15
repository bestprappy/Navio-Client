"use client";
import { useId } from "react";
import { useAtom } from "jotai";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { batteryThresholdPctAtom } from "../garage/garage.atoms";

type AutoAddThresholdProps = {
  disabled?: boolean;
  /** The day's lowest predicted arrival at an itinerary stop, drawn under the slider for comparison. */
  lowestStopPct: number | null;
};

function clampPct(value: number): number {
  return Math.max(1, Math.min(100, Math.round(value)));
}

/** Matches the slider's edge-aligned thumb (1rem wide) so the marker lines up with the thumb at that value. */
function trackPosition(pct: number): string {
  return `calc(0.5rem + ${Math.max(0, Math.min(100, pct)) / 100} * (100% - 1rem))`;
}

/** The only Auto Add setting: charge before any itinerary stop would be reached below this level. */
export function AutoAddThreshold({ disabled = false, lowestStopPct }: AutoAddThresholdProps) {
  const id = useId();
  const [threshold, setThreshold] = useAtom(batteryThresholdPctAtom);
  const lowest = lowestStopPct === null ? null : Math.round(lowestStopPct);
  const triggers = lowest !== null && lowest < threshold;

  return (
    <div data-tour="planner.ev-reserve">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          Charge before dropping below
        </label>
        <div className="flex items-baseline gap-1">
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            value={threshold}
            disabled={disabled}
            aria-describedby={`${id}-context`}
            className="h-9 w-16 px-2 text-right text-base font-semibold tabular-nums"
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              if (Number.isFinite(value)) setThreshold(clampPct(value));
            }}
          />
          <span className="text-sm text-muted-foreground" aria-hidden="true">%</span>
        </div>
      </div>

      <div className="mt-3">
        <Slider
          min={1}
          max={100}
          step={1}
          value={threshold}
          disabled={disabled}
          onValueChange={(value) => setThreshold(clampPct(Array.isArray(value) ? value[0] : value))}
          getAriaLabel={() => "Battery threshold"}
          getAriaValueText={(value) => `${value}%`}
        />
        {lowest !== null ? (
          <div className="relative h-5" aria-hidden="true">
            <span
              className={cn(
                "absolute top-0 flex items-start gap-1 text-[0.6875rem] leading-4 whitespace-nowrap",
                triggers ? "battery-text-low" : "text-muted-foreground",
                lowest > 60 ? "-translate-x-full flex-row-reverse" : "",
              )}
              style={{ left: trackPosition(lowest) }}
            >
              <span className={cn("h-3 w-0.5 rounded-full", triggers ? "bg-current" : "bg-muted-foreground/70")} />
              Lowest stop
            </span>
          </div>
        ) : null}
      </div>

      <p id={`${id}-context`} className="mt-1 text-xs leading-5 text-muted-foreground">
        {lowest === null
          ? "Navio adds a charger before any stop you would reach below this level."
          : triggers
            ? <>The lowest stop on this day is reached at <span className="font-medium text-foreground tabular-nums">{lowest}%</span>, under your threshold, so a charger goes in before it.</>
            : <>The lowest stop on this day is reached at <span className="font-medium text-foreground tabular-nums">{lowest}%</span>. Raise the threshold above it to charge sooner.</>}
      </p>
    </div>
  );
}
