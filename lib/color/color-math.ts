/**
 * Conversions between the color models the color picker shows. Channels are
 * integers: RGB 0-255, hue 0-360, saturation, value and lightness 0-100.
 */

export type Rgb = { r: number; g: number; b: number };
export type Hsv = { h: number; s: number; v: number };
export type Hsl = { h: number; s: number; l: number };

const HEX = /^#?([0-9a-f]{6})$/i;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Parses #rrggbb (the # is optional). Returns null for anything else. */
export function hexToRgb(hex: string): Rgb | null {
  const match = HEX.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);
  return { h: hueOf(red, green, blue, max, delta), s: max === 0 ? 0 : (delta / max) * 100, v: max * 100 };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;
  const channel = (n: number) => {
    const k = (n + (((h % 360) + 360) % 360) / 60) % 6;
    return Math.round((value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return { r: channel(5), g: channel(3), b: channel(1) };
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h: hueOf(red, green, blue, max, delta), s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + (((h % 360) + 360) % 360) / 30) % 12;
    return Math.round((lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return { r: channel(0), g: channel(8), b: channel(4) };
}

function hueOf(red: number, green: number, blue: number, max: number, delta: number): number {
  if (delta === 0) return 0;
  const sector = max === red ? ((green - blue) / delta) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  return (sector * 60 + 360) % 360;
}
