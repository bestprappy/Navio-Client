"use client";

import { useCallback, useMemo } from "react";

import { usePaletteColors } from "@/components/palette/use-palette-colors";

import { getTripBlockColorById, tripBlockColorOptions, type TripBlockColorOption } from "./trip-block-colors";
import type { TripBlockColorId } from "./types";

/**
 * A color resolver whose identity changes when the palette loads or changes.
 * Map layers need real hex values, so they memoize on this instead of calling
 * getTripBlockColorById directly.
 */
export function useTripBlockColorResolver() {
  const { colors } = usePaletteColors();
  const byId = useMemo(() => new Map(colors.map((color) => [color.id, color])), [colors]);
  return useCallback((colorId: TripBlockColorId) => getTripBlockColorById(colorId, (id) => byId.get(id)), [byId]);
}

/**
 * The colors a picker offers: the palette's active colors in admin order, or
 * the built-in set while the palette is loading or unreachable.
 */
export function usePaletteOptions(): TripBlockColorOption[] {
  const { activeColors } = usePaletteColors();
  return useMemo(
    () =>
      activeColors.length > 0
        ? activeColors.map((color) => ({ ...getTripBlockColorById(color.id, () => color), label: color.name }))
        : tripBlockColorOptions,
    [activeColors],
  );
}
