"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { clamp } from "@/lib/color/color-math";
import { cn } from "@/lib/utils";

import { useColorPickerContext } from "./color-picker-context";

const RAINBOW = "linear-gradient(to right, #f00 0%, #ff0 16.66%, #0f0 33.33%, #0ff 50%, #00f 66.66%, #f0f 83.33%, #f00 100%)";

/** The hue track. Arrow keys move one degree, Shift or Page keys fifteen. */
export function HueSlider({ className }: { className?: string }) {
  const { hsv, disabled, setHsv } = useColorPickerContext("HueSlider");
  const track = useRef<HTMLDivElement>(null);

  function moveTo(clientX: number) {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    setHsv({ ...hsv, h: clamp(((clientX - box.left) / box.width) * 360, 0, 360) });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    moveTo(event.clientX);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const step = event.shiftKey || event.key.startsWith("Page") ? 15 : 1;
    const next: Record<string, number> = {
      ArrowLeft: hsv.h - step, ArrowDown: hsv.h - step, PageDown: hsv.h - step,
      ArrowRight: hsv.h + step, ArrowUp: hsv.h + step, PageUp: hsv.h + step,
      Home: 0, End: 360,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    setHsv({ ...hsv, h: clamp(Math.round(next[event.key]), 0, 360) });
  }

  return (
    <div
      ref={track}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hsv.h)}
      aria-valuetext={`${Math.round(hsv.h)} degrees`}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event.clientX); }}
      onKeyDown={onKeyDown}
      className={cn(
        "relative h-3 flex-1 cursor-pointer touch-none rounded-full outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={{ backgroundImage: RAINBOW }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_oklch(0_0_0/0.3),0_1px_3px_oklch(0_0_0/0.4)]"
        style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
      />
    </div>
  );
}
