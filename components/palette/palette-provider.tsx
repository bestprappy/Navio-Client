"use client";

import { useEffect, useMemo, type ReactNode } from "react";

import { paletteCssVariables, registerPaletteColors } from "@/lib/palette/palette-colors";

import { usePaletteColors } from "./use-palette-colors";

/**
 * Loads the admin-managed palette once for the whole app.
 *
 * It fills the synchronous color registry before its children render, and
 * publishes every color as a CSS custom property so cards, chips and pins
 * that were rendered before the palette arrived recolor without re-rendering.
 */
export function PaletteProvider({ children }: { children: ReactNode }) {
  const { colors, isError } = usePaletteColors();

  // Registering during render is idempotent and keeps children consistent on
  // their first render after the palette arrives.
  useMemo(() => registerPaletteColors(colors), [colors]);
  const css = useMemo(() => paletteCssVariables(colors), [colors]);

  useEffect(() => {
    if (isError) {
      console.warn("[PaletteProvider] Could not load the color palette; built-in colors are shown instead.");
    }
  }, [isError]);

  return (
    <>
      {/* Content comes only from ids and hex codes that passed strict format checks. */}
      {css ? <style id="navio-palette" dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {children}
    </>
  );
}
