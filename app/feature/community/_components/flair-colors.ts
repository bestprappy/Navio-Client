import { z } from "zod";

import { DARK_TEXT, LIGHT_TEXT, contrastRatio } from "@/lib/palette/palette-colors";

/**
 * Community flairs carry their own color: any #rrggbb a moderator picks, with
 * white or black text. They are independent of the admin planner palette.
 */
export const FLAIR_TEXT_COLORS = ["white", "black"] as const;
export type FlairTextColor = (typeof FLAIR_TEXT_COLORS)[number];

export const FLAIR_HEX_PATTERN = /^#[0-9a-f]{6}$/i;
export const flairHexSchema = z
  .string()
  .regex(FLAIR_HEX_PATTERN, "Choose a color as #rrggbb.")
  .transform((hex) => hex.toLowerCase());
export const flairTextColorSchema = z.enum(FLAIR_TEXT_COLORS);

export const DEFAULT_FLAIR_COLOR = "#00ae84";

/** Colors new flairs start with, so a fresh list is not one color. */
const STARTER_COLORS = ["#2f6fde", "#0f8b6c", "#d9480f", "#7c3aed", "#c2255c", "#a16207"];

export function starterFlairColor(index: number): string {
  return STARTER_COLORS[index % STARTER_COLORS.length] ?? DEFAULT_FLAIR_COLOR;
}

export function flairTextHex(textColor: FlairTextColor): string {
  return textColor === "white" ? LIGHT_TEXT : DARK_TEXT;
}

/** White or black, whichever reads better on this color. */
export function readableFlairText(hex: string): FlairTextColor {
  return contrastRatio(hex, LIGHT_TEXT) >= contrastRatio(hex, DARK_TEXT) ? "white" : "black";
}

/**
 * Badge text is short and bold, so warn only below 3:1 (WCAG's bar for large
 * text and UI marks). Stricter flags most saturated mid-tones a moderator
 * would reasonably pick.
 */
const MIN_TEXT_CONTRAST = 3;

export function isFlairTextHardToRead(hex: string, textColor: FlairTextColor): boolean {
  return FLAIR_HEX_PATTERN.test(hex) && contrastRatio(hex, flairTextHex(textColor)) < MIN_TEXT_CONTRAST;
}
