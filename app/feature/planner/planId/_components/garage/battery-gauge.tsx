"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BATTERY_TONES, getBatteryTone } from "./garage-formatters";

const CELL_DIVIDERS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

type BatteryGaugeProps = {
  /** Charge shown as the solid fill. */
  value: number;
  /** Earlier charge shown as a faint fill behind `value`, e.g. the start of the trip. */
  previousValue?: number;
  /** Charge a stop adds, drawn as striped charging green from `value` up to this level. */
  chargeTo?: number;
  /** Draws a knob at this level, e.g. the target of a draggable control. */
  markerPct?: number;
  reservePct: number;
  className?: string;
  /** Overlay content, such as a transparent range input that makes the battery draggable. */
  children?: ReactNode;
};

/** A horizontal battery: ten cells, a terminal nub, level-colored fill and a dashed reserve mark. */
export function BatteryGauge({ value, previousValue, chargeTo, markerPct, reservePct, className, children }: BatteryGaugeProps) {
  const pct = clampPct(value);
  const tone = BATTERY_TONES[getBatteryTone(pct, reservePct)];
  const ghost = previousValue !== undefined && previousValue > pct ? clampPct(previousValue) : null;
  const charged = chargeTo !== undefined && chargeTo > pct ? clampPct(chargeTo) : null;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative h-12 flex-1 rounded-lg border-2 border-foreground/25 p-1">
        <div className="relative h-full overflow-hidden rounded-md bg-muted" aria-hidden="true">
          {ghost !== null && (
            <div className="absolute inset-y-0 left-0 bg-foreground/10 dark:bg-foreground/20" style={{ width: `${ghost}%` }} />
          )}
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-r-sm transition-[width] duration-200 ease-out motion-reduce:transition-none",
              tone.fill,
            )}
            style={{ width: `${pct}%` }}
          />
          {charged !== null && (
            <div
              className="charge-stripes absolute inset-y-0 transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
              style={{ left: `${pct}%`, width: `${charged - pct}%` }}
            />
          )}
          {CELL_DIVIDERS.map((divider) => (
            <span key={divider} className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-card/70" style={{ left: `${divider}%` }} />
          ))}
          <span
            className="absolute -inset-y-1 border-l-2 border-dashed border-destructive"
            style={{ left: `${clampPct(reservePct)}%` }}
          />
        </div>
        {markerPct !== undefined && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-y-1 w-2 -translate-x-1/2 rounded-full bg-foreground shadow-md ring-2 ring-card"
            style={{ left: `calc(0.25rem + ${clampPct(markerPct) / 100} * (100% - 0.5rem))` }}
          />
        )}
        {children}
      </div>
      <span className="h-5 w-1.5 shrink-0 rounded-r-sm bg-foreground/25" aria-hidden="true" />
    </div>
  );
}

type BatteryInputProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  reservePct: number;
  disabled?: boolean;
  step?: number;
  ariaLabel?: string;
  ariaDescribedBy?: string;
};

/** The battery itself is the control: a transparent native range input keeps pointer and keyboard support. */
export function BatteryInput({
  id,
  value,
  onChange,
  reservePct,
  disabled = false,
  step = 5,
  ariaLabel,
  ariaDescribedBy,
}: BatteryInputProps) {
  return (
    <BatteryGauge
      value={value}
      reservePct={reservePct}
      className={cn(
        "rounded-lg has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-card",
        disabled && "opacity-60",
      )}
    >
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-valuetext={`${value}%`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="absolute inset-0 size-full cursor-pointer opacity-0 outline-none disabled:cursor-not-allowed"
      />
    </BatteryGauge>
  );
}
