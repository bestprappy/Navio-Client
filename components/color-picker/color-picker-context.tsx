"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv, type Hsv } from "@/lib/color/color-math";

type ColorPickerContextValue = {
  /** Hue, saturation and value as the picker draws them. Hue survives greys. */
  hsv: Hsv;
  hex: string;
  disabled: boolean;
  setHsv: (next: Hsv) => void;
  setHex: (next: string) => void;
};

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

export function useColorPickerContext(component: string): ColorPickerContextValue {
  const context = useContext(ColorPickerContext);
  if (!context) throw new Error(`<ColorPicker.${component}> must be rendered inside <ColorPicker.Root>.`);
  return context;
}

type ColorPickerRootProps = {
  /** A #rrggbb color. Anything else leaves the picker on its last valid color. */
  value: string;
  onValueChange: (hex: string) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

function hsvFrom(hex: string, previous: Hsv): Hsv {
  const rgb = hexToRgb(hex);
  if (!rgb) return previous;
  const next = rgbToHsv(rgb);
  // Greys and black have no hue of their own; keep the slider where it was.
  return next.s === 0 || next.v === 0 ? { ...next, h: previous.h } : next;
}

/** Holds the picked color. Children read and change it through context. */
export function ColorPickerRoot({ value, onValueChange, disabled = false, className, children }: ColorPickerRootProps) {
  const [state, setState] = useState(() => ({ source: value, hsv: hsvFrom(value, { h: 0, s: 0, v: 0 }) }));

  // A hex typed elsewhere (a text field, a reset) moves the handles. Adjusting
  // state during render avoids drawing one frame with the old color.
  let hsv = state.hsv;
  if (state.source !== value) {
    const lower = value.toLowerCase();
    const sameColor = rgbToHex(hsvToRgb(state.hsv)) === lower;
    hsv = sameColor ? state.hsv : hsvFrom(value, state.hsv);
    setState({ source: value, hsv });
  }

  const setHsv = useCallback((next: Hsv) => {
    const hex = rgbToHex(hsvToRgb(next));
    setState({ source: hex, hsv: next });
    onValueChange(hex);
  }, [onValueChange]);

  const setHex = useCallback((next: string) => {
    if (!hexToRgb(next)) return;
    onValueChange(next.toLowerCase());
  }, [onValueChange]);

  const hex = rgbToHex(hsvToRgb(hsv));
  const context = useMemo(() => ({ hsv, hex, disabled, setHsv, setHex }), [hsv, hex, disabled, setHsv, setHex]);

  return (
    <ColorPickerContext.Provider value={context}>
      <div className={className} data-disabled={disabled || undefined}>{children}</div>
    </ColorPickerContext.Provider>
  );
}
