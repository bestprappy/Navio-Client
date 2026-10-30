"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { type TripBlockColorOption } from "../constants/trip-block-colors";
import type { TripBlockColorId } from "../constants/types";
import { usePaletteOptions } from "../constants/use-trip-block-color";

type TripColorSwatchesProps = {
  /** `null` when none of the swatches is the current colour. */
  selectedId: TripBlockColorId | null;
  onSelect: (colorId: TripBlockColorId) => void;
  getLabel: (color: TripBlockColorOption) => string;
};

/** The planner palette (admin colors once loaded) as a grid of pressable swatches. */
export function TripColorSwatches({ selectedId, onSelect, getLabel }: TripColorSwatchesProps) {
  const colorOptions = usePaletteOptions();
  return (
    <div className="grid grid-cols-8 gap-2">
      {colorOptions.map((color) => {
        const isSelected = selectedId === color.id;
        return (
          <button
            key={color.id}
            type="button"
            aria-label={getLabel(color)}
            aria-pressed={isSelected}
            className={cn(
              "flex size-7 items-center justify-center rounded-full shadow-xs ring-offset-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              isSelected && "ring-2 ring-foreground/20",
            )}
            style={{ backgroundColor: color.value, color: color.foreground }}
            onClick={() => onSelect(color.id)}
          >
            {isSelected ? <Check className="size-4" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}
