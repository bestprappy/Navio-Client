import { z } from "zod";

/**
 * The admin-managed color palette shared by trip sections and guide categories.
 *
 * Saved trips and guides store only a color id. Administrators add and retire
 * colors but never change a hex, so an id resolves to the same color. Retired
 * colors are still served so old trips keep rendering. A retired color can be
 * deleted for good: its id is still served, flagged deleted, and everything
 * saved with it draws the default color instead.
 */

/** Same rule as the server. Safe to embed in a CSS custom property name. */
export const PALETTE_COLOR_ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

/** The label drawn on a color: best contrast, or always white or black. */
export const TEXT_COLOR_CHOICES = ["auto", "white", "black"] as const;
export type TextColorChoice = (typeof TEXT_COLOR_CHOICES)[number];
const textColorSchema = z.enum(TEXT_COLOR_CHOICES).catch("auto");

export const paletteColorSchema = z.object({
  id: z.string().regex(PALETTE_COLOR_ID_PATTERN),
  name: z.string().min(1).max(40),
  hex: z.string().regex(HEX_PATTERN).transform((hex) => hex.toLowerCase()),
  retired: z.boolean(),
  deleted: z.boolean().default(false),
  textOnLight: textColorSchema.default("auto"),
  textOnDark: textColorSchema.default("auto"),
});
/** Up to 200 colors plus the ids of deleted ones. */
export const paletteColorsSchema = z.array(paletteColorSchema).max(1000);

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

/** The id saved references fall back to, in the client's built-in set and on the server. */
export const DEFAULT_PALETTE_COLOR_ID = "teal";
const DEFAULT_PALETTE_COLOR_HEX = "#00ae84";

/** Active colors in picker order, or null before the palette has loaded. */
export function getRegisteredActiveColorIds(): string[] | null {
  if (ordered.length === 0) return null;
  return ordered.filter((color) => !color.retired).map((color) => color.id);
}

// ------------------------------------------------------------ contrast

export const DARK_TEXT = "#14161c";
export const LIGHT_TEXT = "#ffffff";

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

/** The label color an administrator chose for one theme. */
export function labelColor(hex: string, choice: TextColorChoice): string {
  return choice === "white" ? LIGHT_TEXT : choice === "black" ? DARK_TEXT : readableForeground(hex);
}

/** Same surfaces and threshold the server checks when an admin adds a color. */
export const LIGHT_SURFACE = "#ffffff";
export const DARK_SURFACE = "#1b1d24";
export const MIN_SURFACE_CONTRAST = 1.5;

export function isVisibleOnBothThemes(hex: string): boolean {
  return contrastRatio(hex, LIGHT_SURFACE) >= MIN_SURFACE_CONTRAST && contrastRatio(hex, DARK_SURFACE) >= MIN_SURFACE_CONTRAST;
}

/**
 * One rule per color, so DOM styles pick up palette changes without a
 * re-render. Label colors can differ per theme, so dark-theme overrides go in
 * a second rule. A deleted id points at the default color's variables, so it
 * follows the default's label choice too.
 */
export function paletteCssVariables(colors: readonly PaletteColor[]): string {
  const fallback = `var(${paletteColorVariable(DEFAULT_PALETTE_COLOR_ID)}, ${DEFAULT_PALETTE_COLOR_HEX})`;
  const fallbackForeground = `var(${paletteForegroundVariable(DEFAULT_PALETTE_COLOR_ID)}, ${LIGHT_TEXT})`;
  const light: string[] = [];
  const dark: string[] = [];
  for (const color of colors) {
    if (color.deleted) {
      light.push(`${paletteColorVariable(color.id)}:${fallback};`, `${paletteForegroundVariable(color.id)}:${fallbackForeground};`);
      continue;
    }
    const onLight = labelColor(color.hex, color.textOnLight);
    const onDark = labelColor(color.hex, color.textOnDark);
    light.push(`${paletteColorVariable(color.id)}:${color.hex};`, `${paletteForegroundVariable(color.id)}:${onLight};`);
    if (onDark !== onLight) dark.push(`${paletteForegroundVariable(color.id)}:${onDark};`);
  }
  return `${light.length ? `:root{${light.join("")}}` : ""}${dark.length ? `.dark{${dark.join("")}}` : ""}`;
}

// ------------------------------------------------------------ loading

export async function fetchPaletteColors(signal?: AbortSignal): Promise<PaletteColor[]> {
  const response = await fetch("/api/palette-colors", { cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok) throw new Error(`Palette request failed with ${response.status}`);
  const parsed = paletteColorsSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Palette response was malformed");
  return parsed.data;
}
