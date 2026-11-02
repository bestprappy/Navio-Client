import { contrastRatio, labelColor, type TextColorChoice } from "@/lib/palette/palette-colors";

import type { TextColors } from "./palette-api";

export type LabelTextStyle = TextColors & { id: string; label: string };

/** The label text choices an administrator can give a color, in menu order. */
export const LABEL_TEXT_STYLES: readonly LabelTextStyle[] = [
  { id: "auto", label: "Automatic", textOnLight: "auto", textOnDark: "auto" },
  { id: "white", label: "White in both themes", textOnLight: "white", textOnDark: "white" },
  { id: "black", label: "Black in both themes", textOnLight: "black", textOnDark: "black" },
  { id: "white-light", label: "White in light, black in dark", textOnLight: "white", textOnDark: "black" },
  { id: "black-light", label: "Black in light, white in dark", textOnLight: "black", textOnDark: "white" },
];

/** Older rows may hold a combination the menu does not offer (auto in one theme only). */
export function labelTextStyleId(colors: TextColors): string {
  return LABEL_TEXT_STYLES.find((style) => style.textOnLight === colors.textOnLight && style.textOnDark === colors.textOnDark)?.id ?? "custom";
}

export function labelTextStyleById(id: string): LabelTextStyle | undefined {
  return LABEL_TEXT_STYLES.find((style) => style.id === id);
}

/** Below this, small bold label text on the color is hard to read. */
export const MIN_LABEL_CONTRAST = 3;

/** The themes where this choice puts hard-to-read text on the color. */
export function lowContrastThemes(hex: string, colors: TextColors): ("light" | "dark")[] {
  const themes: ["light" | "dark", TextColorChoice][] = [["light", colors.textOnLight], ["dark", colors.textOnDark]];
  return themes.filter(([, choice]) => contrastRatio(hex, labelColor(hex, choice)) < MIN_LABEL_CONTRAST).map(([theme]) => theme);
}
