"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { clamp } from "@/lib/color/color-math";
import { cn } from "@/lib/utils";

import { useColorPickerContext } from "./color-picker-context";

const STEP = 1;
const LARGE_STEP = 10;

/**
 * Saturation runs left to right and brightness bottom to top. Arrow keys move
 * the handle one step, Shift or Page keys ten.
 */
export function ColorArea({ className, label = "Color" }: { className?: string; label?: string }) {
  const { hsv, hex, disabled, setHsv } = useColorPickerContext("Area");
  const surface = useRef<HTMLDivElement>(null);

  function moveTo(clientX: number, clientY: number) {
    const box = surface.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    setHsv({
      h: hsv.h,
      s: clamp(((clientX - box.left) / box.width) * 100, 0, 100),
      v: clamp(100 - ((clientY - box.top) / box.height) * 100, 0, 100),
    });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    moveTo(event.clientX, event.clientY);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event.clientX, event.clientY);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const step = event.shiftKey || event.key.startsWith("Page") ? LARGE_STEP : STEP;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
      PageUp: [0, step], PageDown: [0, -step],
    };
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setHsv({ ...hsv, s: event.key === "Home" ? 0 : 100 });
      return;
    }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setHsv({ h: hsv.h, s: clamp(Math.round(hsv.s) + move[0], 0, 100), v: clamp(Math.round(hsv.v) + move[1], 0, 100) });
  }

  return (
    <div
      ref={surface}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${label}: saturation and brightness`}
      aria-roledescription="2D slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsv.s)}
      aria-valuetext={`Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%`}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
      className={cn(
        "relative aspect-[4/3] w-full cursor-crosshair touch-none rounded-lg outline-none select-none",
        "shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)] focus-visible:ring-3 focus-visible:ring-ring/50",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={{
        backgroundColor: `hsl(${hsv.h} 100% 50%)`,
        backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_oklch(0_0_0/0.3),0_1px_3px_oklch(0_0_0/0.4)]"
        style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: hex }}
      />
    </div>
  );
}
