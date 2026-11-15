"use client";

import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MAX_ZOOM, MIN_ZOOM } from "@/lib/avatar-crop";

type CropZoomControlsProps = {
  zoom: number;
  step: number;
  disabled: boolean;
  /** False when the photo is already centred and unzoomed. */
  canReset: boolean;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
};

const percent = (zoom: number) => `${Math.round(zoom * 100)}%`;

/** Zoom out / slider / zoom in, the current scale, and a reset to the centred fit. */
export function CropZoomControls({ zoom, step, disabled, canReset, onZoomChange, onReset }: CropZoomControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Zoom out"
        disabled={disabled || zoom <= MIN_ZOOM}
        onClick={() => onZoomChange(zoom - step)}
        className="text-muted-foreground hover:text-foreground"
      >
        <ZoomOut aria-hidden="true" />
      </Button>

      <Slider
        value={zoom}
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.01}
        disabled={disabled}
        onValueChange={(value) => onZoomChange(typeof value === "number" ? value : (value[0] ?? zoom))}
        getAriaLabel={() => "Zoom"}
        getAriaValueText={(_, value) => percent(value)}
        className="flex-1"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Zoom in"
        disabled={disabled || zoom >= MAX_ZOOM}
        onClick={() => onZoomChange(zoom + step)}
        className="text-muted-foreground hover:text-foreground"
      >
        <ZoomIn aria-hidden="true" />
      </Button>

      <output aria-hidden="true" className="w-12 text-right text-sm font-medium tabular-nums text-foreground">
        {percent(zoom)}
      </output>

      <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-border sm:block" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Reset position and zoom"
        disabled={disabled || !canReset}
        onClick={onReset}
        className="text-muted-foreground hover:text-foreground"
      >
        <RotateCcw aria-hidden="true" />
        <span aria-hidden="true" className="hidden sm:inline">Reset</span>
      </Button>
    </div>
  );
}
