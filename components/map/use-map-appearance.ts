"use client";

import { useAtomValue } from "jotai";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { mapAppearanceAtom } from "./map-appearance.atoms";
import { mapPalettes, resolveMapStyle } from "./map-appearance";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useMapAppearance() {
  const appearance = useAtomValue(mapAppearanceAtom);
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const style = resolveMapStyle(appearance.style, hydrated && resolvedTheme === "dark");
  return { ...appearance, resolvedStyle: style, palette: mapPalettes[style] };
}
