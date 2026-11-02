"use client";

import { useSyncExternalStore } from "react";
import { Pipette } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useColorPickerContext } from "./color-picker-context";

type EyeDropperResult = { sRGBHex: string };
type EyeDropperConstructor = new () => { open: (options?: { signal?: AbortSignal }) => Promise<EyeDropperResult> };

function eyeDropper(): EyeDropperConstructor | undefined {
  return (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
}

const noop = () => () => {};

/**
 * Samples a color from anywhere on screen. Only Chromium browsers offer the
 * EyeDropper API, so elsewhere the button is not rendered at all.
 */
export function EyeDropperButton() {
  const { disabled, setHex } = useColorPickerContext("EyeDropper");
  const supported = useSyncExternalStore(noop, () => Boolean(eyeDropper()), () => false);
  if (!supported) return null;

  async function sample() {
    const Dropper = eyeDropper();
    if (!Dropper) return;
    try {
      const { sRGBHex } = await new Dropper().open();
      setHex(sRGBHex);
    } catch (error) {
      // Escape cancels with an AbortError; anything else is worth knowing about.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("[EyeDropperButton] sampling failed", error);
      }
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label="Pick a color from the screen" onClick={sample}>
      <Pipette aria-hidden="true" />
    </Button>
  );
}
