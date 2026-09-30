"use client";

import { useAtomValue } from "jotai";

import { arrivalReservePctAtom } from "./garage.atoms";
import { getBatteryTone, type BatteryTone } from "./garage-formatters";

const THUMB_SIZE = 20;
const THUMB_HALF = THUMB_SIZE / 2;
const LABELS = [0, 25, 50, 75, 100];

const TONE_COLORS: Record<BatteryTone, string> = {
  high: "var(--battery-high)",
  mid: "var(--battery-mid)",
  low: "var(--battery-low)",
  critical: "var(--battery-critical)",
};

export function getBatteryColor(pct: number, reservePct: number): string {
  return TONE_COLORS[getBatteryTone(pct, reservePct)];
}

type BatterySliderProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  color?: string;
  disabled?: boolean;
  showLabels?: boolean;
};

export function BatterySlider({
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  ariaLabel = "Set battery percentage",
  color,
  disabled = false,
  showLabels = true,
}: BatterySliderProps) {
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const ratio = (value - min) / (max - min);
  const sliderColor = color ?? getBatteryColor(value, reservePct);

  return (
    <div className="relative w-full select-none">
      <div className="relative rounded-md focus-within:ring-2 focus-within:ring-ring" style={{ height: THUMB_SIZE + 8 }}>
        {/* Track (inset by half-thumb on each side so thumb center aligns with track edges) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full bg-muted"
          style={{ left: THUMB_HALF, right: THUMB_HALF, height: 3 }}
        >
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-100"
            style={{ width: `${ratio * 100}%`, backgroundColor: sliderColor }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center shadow-md pointer-events-none transition-[left,background-color] duration-100"
          style={{
            left: `calc(${ratio} * (100% - ${THUMB_SIZE}px))`,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            backgroundColor: sliderColor,
            opacity: disabled ? 0.55 : 1,
          }}
          aria-hidden="true"
        >
          <div className="rounded-full bg-primary-foreground/70" style={{ width: 7, height: 7 }} />
        </div>

        {/* Native input overlay — transparent, handles all interaction and keyboard events */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={ariaLabel}
        />
      </div>

      {/* Tick labels */}
      {showLabels ? (
        <div className="relative mt-2" style={{ height: "1rem" }}>
          {LABELS.filter((label) => label >= min && label <= max).map((label) => {
            const labelRatio = (label - min) / (max - min);
            return (
              <span
                key={label}
                className="absolute text-xs text-muted-foreground"
                style={{
                  left: `calc(${THUMB_HALF}px + ${labelRatio} * (100% - ${THUMB_SIZE}px))`,
                  transform: `translateX(-${labelRatio * 100}%)`,
                }}
              >
                {label}%
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
