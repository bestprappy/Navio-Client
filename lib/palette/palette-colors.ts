import { z } from "zod";

/**
 * The admin-managed color palette shared by trip sections and guide categories.
 *
 * Saved trips and guides store only a color id. Administrators add and retire
 * colors but never delete one or change its hex, so an id always resolves to
 * the same color. Retired colors are still served so old trips keep rendering.
 */

/** Same rule as the server. Safe to embed in a CSS custom property name. */
export const PALETTE_COLOR_ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export const paletteColorSchema = z.object({
  id: z.string().regex(PALETTE_COLOR_ID_PATTERN),
  name: z.string().min(1).max(40),
  hex: z.string().regex(HEX_PATTERN).transform((hex) => hex.toLowerCase()),
  retired: z.boolean(),
});
export const paletteColorsSchema = z.array(paletteColorSchema).max(200);

export type PaletteColor = z.infer<typeof paletteColorSchema>;

export const paletteQueryKey = ["palette-colors"] as const;

export function isPaletteColorId(value: unknown): value is string {
  return typeof value === "string" && PALETTE_COLOR_ID_PATTERN.test(value);
}

/** The CSS custom property that carries an admin-added color. */
export function paletteColorVariable(id: string): string {
  return `--palette-${id}`;
}

export function paletteForegroundVariable(id: string): string {
  return `--palette-${id}-fg`;
}

// ------------------------------------------------------------ registry

/*
 * Module-level copy of the last palette the server returned. Color lookups run
 * in render code, map layers and spreadsheet export, so they stay synchronous;
 * PaletteProvider fills this and components that need a re-render when it
 * changes subscribe through usePaletteColors.
 */
let registry = new Map<string, PaletteColor>();
let ordered: PaletteColor[] = [];

export function registerPaletteColors(colors: readonly PaletteColor[]): void {
  ordered = [...colors];
  registry = new Map(colors.map((color) => [color.id, color]));
}

export function getRegisteredPaletteColor(id: string): PaletteColor | undefined {
  return registry.get(id);
}

/** Active colors in picker order, or null before the palette has loaded. */
export function getRegisteredActiveColorIds(): string[] | null {
  if (ordered.length === 0) return null;
  return ordered.filter((color) => !color.retired).map((color) => color.id);
}

// ------------------------------------------------------------ contrast

const DARK_TEXT = "#14161c";
const LIGHT_TEXT = "#ffffff";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = channel(Number.parseInt(hex.slice(1, 3), 16));
  const g = channel(Number.parseInt(hex.slice(3, 5), 16));
  const b = channel(Number.parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colors. */
export function contrastRatio(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Whichever of white or near-black text reads better on this color. */
export function readableForeground(hex: string): string {
  return contrastRatio(hex, LIGHT_TEXT) >= contrastRatio(hex, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

/** Same surfaces and threshold the server checks when an admin adds a color. */
export const LIGHT_SURFACE = "#ffffff";
export const DARK_SURFACE = "#1b1d24";
export const MIN_SURFACE_CONTRAST = 1.5;

export function isVisibleOnBothThemes(hex: string): boolean {
  return contrastRatio(hex, LIGHT_SURFACE) >= MIN_SURFACE_CONTRAST && contrastRatio(hex, DARK_SURFACE) >= MIN_SURFACE_CONTRAST;
}

/** One rule per color, so DOM styles pick up admin-added colors without a re-render. */
export function paletteCssVariables(colors: readonly PaletteColor[]): string {
  const declarations = colors.flatMap((color) => [
    `${paletteColorVariable(color.id)}:${color.hex};`,
    `${paletteForegroundVariable(color.id)}:${readableForeground(color.hex)};`,
  ]);
  return declarations.length ? `:root{${declarations.join("")}}` : "";
}

// ------------------------------------------------------------ loading

export async function fetchPaletteColors(signal?: AbortSignal): Promise<PaletteColor[]> {
  const response = await fetch("/api/palette-colors", { cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok) throw new Error(`Palette request failed with ${response.status}`);
  const parsed = paletteColorsSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Palette response was malformed");
  return parsed.data;
}
