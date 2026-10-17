import {
  getRegisteredActiveColorIds,
  getRegisteredPaletteColor,
  isPaletteColorId,
  paletteColorVariable,
  paletteForegroundVariable,
  type PaletteColor,
} from "../../../../../../lib/palette/palette-colors";

import type { BuiltInTripBlockColorId, TripBlockColorId } from "./types";

export type TripBlockColorOption = {
  id: TripBlockColorId;
  label: string;
  value: string;
  foreground: string;
  /** sRGB hex equivalent of `value` — safe for MapLibre GL paint properties. */
  mapColor: string;
};

export const tripBlockColorOptions: (TripBlockColorOption & { id: BuiltInTripBlockColorId })[] = [
  { id: "teal",    label: "Teal",    value: "var(--planner-block-teal)",    foreground: "var(--planner-block-foreground)", mapColor: "#00ae84" },
  { id: "cyan",    label: "Cyan",    value: "var(--planner-block-cyan)",    foreground: "var(--planner-block-foreground)", mapColor: "#00b2b2" },
  { id: "blue",    label: "Blue",    value: "var(--planner-block-blue)",    foreground: "var(--planner-block-foreground)", mapColor: "#008cdf" },
  { id: "indigo",  label: "Indigo",  value: "var(--planner-block-indigo)",  foreground: "var(--planner-block-foreground)", mapColor: "#5d67ee" },
  { id: "violet",  label: "Violet",  value: "var(--planner-block-violet)",  foreground: "var(--planner-block-foreground)", mapColor: "#8654cc" },
  { id: "rose",    label: "Rose",    value: "var(--planner-block-rose)",    foreground: "var(--planner-block-foreground)", mapColor: "#d83e89" },
  { id: "coral",   label: "Coral",   value: "var(--planner-block-coral)",   foreground: "var(--planner-block-foreground)", mapColor: "#f0584b" },
  { id: "amber",   label: "Amber",   value: "var(--planner-block-amber)",   foreground: "var(--planner-block-foreground)", mapColor: "#ea8a18" },
  { id: "emerald", label: "Emerald", value: "var(--planner-block-emerald)", foreground: "var(--planner-block-foreground)", mapColor: "#009342" },
  { id: "pine",    label: "Pine",    value: "var(--planner-block-pine)",    foreground: "var(--planner-block-foreground)", mapColor: "#00603c" },
  { id: "navy",    label: "Navy",    value: "var(--planner-block-navy)",    foreground: "var(--planner-block-foreground)", mapColor: "#005189" },
  { id: "slate",   label: "Slate",   value: "var(--planner-block-slate)",   foreground: "var(--planner-block-foreground)", mapColor: "#3b4372" },
  { id: "plum",    label: "Plum",    value: "var(--planner-block-plum)",    foreground: "var(--planner-block-foreground)", mapColor: "#613888" },
  { id: "wine",    label: "Wine",    value: "var(--planner-block-wine)",    foreground: "var(--planner-block-foreground)", mapColor: "#972767" },
  { id: "brick",   label: "Brick",   value: "var(--planner-block-brick)",   foreground: "var(--planner-block-foreground)", mapColor: "#ac312a" },
  { id: "rust",    label: "Rust",    value: "var(--planner-block-rust)",    foreground: "var(--planner-block-foreground)", mapColor: "#a94700" },
  { id: "lime",     label: "Lime",     value: "var(--planner-block-lime)",     foreground: "var(--planner-block-foreground)", mapColor: "#56932b" },
  { id: "olive",    label: "Olive",    value: "var(--planner-block-olive)",    foreground: "var(--planner-block-foreground)", mapColor: "#677014" },
  { id: "gold",     label: "Gold",     value: "var(--planner-block-gold)",     foreground: "var(--planner-block-foreground)", mapColor: "#aa7e00" },
  { id: "sky",      label: "Sky",      value: "var(--planner-block-sky)",      foreground: "var(--planner-block-foreground)", mapColor: "#089ac3" },
  { id: "fuchsia",  label: "Fuchsia",  value: "var(--planner-block-fuchsia)",  foreground: "var(--planner-block-foreground)", mapColor: "#b243ba" },
  { id: "mocha",    label: "Mocha",    value: "var(--planner-block-mocha)",    foreground: "var(--planner-block-foreground)", mapColor: "#7c5336" },
  { id: "stone",    label: "Stone",    value: "var(--planner-block-stone)",    foreground: "var(--planner-block-foreground)", mapColor: "#766d62" },
  { id: "graphite", label: "Graphite", value: "var(--planner-block-graphite)", foreground: "var(--planner-block-foreground)", mapColor: "#4e535b" },
];

export const defaultTripBlockColorId = "blue" satisfies TripBlockColorId;

const builtInById = new Map<string, TripBlockColorOption>(tripBlockColorOptions.map((option) => [option.id, option]));

export function isBuiltInTripBlockColorId(colorId: string): boolean {
  return builtInById.has(colorId);
}

/**
 * Resolves any saved color id. Built-in ids keep their theme tokens. Colors an
 * administrator added resolve through CSS custom properties published by
 * PaletteProvider, so they render even before the palette request finishes;
 * map layers need a real hex and use the loaded palette. Unknown or malformed
 * ids fall back to the first built-in color.
 */
export function getTripBlockColorById(
  colorId: TripBlockColorId,
  lookup: (id: string) => PaletteColor | undefined = getRegisteredPaletteColor,
): TripBlockColorOption {
  const builtIn = builtInById.get(colorId);
  if (builtIn) return builtIn;
  const fallback = tripBlockColorOptions[0];
  if (!isPaletteColorId(colorId)) return fallback;
  const registered = lookup(colorId);
  return {
    id: colorId,
    label: registered?.name ?? "Custom color",
    value: `var(${paletteColorVariable(colorId)}, ${fallback.value})`,
    foreground: `var(${paletteForegroundVariable(colorId)}, ${fallback.foreground})`,
    mapColor: registered?.hex ?? fallback.mapColor,
  };
}

/** Fallback route stroke when a segment's block is missing — map SDKs need hex. */
export const defaultRouteMapColor = getTripBlockColorById(defaultTripBlockColorId).mapColor;

const defaultPalette: TripBlockColorId[] = ["teal", "cyan", "blue", "emerald", "amber", "pine", "navy", "slate"];

/**
 * The color a new day or list starts with. Cycles through the familiar default
 * set, skipping colors an administrator retired, and through the whole active
 * palette if every default was retired.
 */
export function getTripBlockColorByIndex(index: number): TripBlockColorId {
  const active = getRegisteredActiveColorIds();
  const defaults = active === null ? defaultPalette : defaultPalette.filter((id) => active.includes(id));
  const cycle = defaults.length > 0 ? defaults : (active ?? []);
  return cycle[index % cycle.length] ?? defaultTripBlockColorId;
}
