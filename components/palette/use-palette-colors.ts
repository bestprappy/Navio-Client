"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  fetchPaletteColors,
  paletteQueryKey,
  type PaletteColor,
} from "@/lib/palette/palette-colors";

const EMPTY: PaletteColor[] = [];

/**
 * The shared palette. Every caller shares one cached request; the palette
 * changes only when an administrator edits it, so it stays fresh for minutes.
 */
export function usePaletteColors() {
  const query = useQuery({
    queryKey: paletteQueryKey,
    queryFn: ({ signal }) => fetchPaletteColors(signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const colors = query.data ?? EMPTY;
  const activeColors = useMemo(() => colors.filter((color) => !color.retired), [colors]);
  return { colors, activeColors, isPending: query.isPending, isError: query.isError, refetch: query.refetch };
}
