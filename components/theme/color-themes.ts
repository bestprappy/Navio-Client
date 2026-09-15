export const colorThemeIds = ["default", "red", "neutral"] as const;

export type ColorThemeId = (typeof colorThemeIds)[number];

export type ColorThemeOption = {
  id: ColorThemeId;
  label: string;
  /** Token holding this theme's primary color for the current light/dark mode. */
  swatch: string;
};

export const colorThemeOptions: readonly ColorThemeOption[] = [
  { id: "default", label: "Default", swatch: "var(--theme-default)" },
  { id: "red", label: "Red", swatch: "var(--theme-red)" },
  { id: "neutral", label: "Neutral", swatch: "var(--theme-neutral)" },
];

export const defaultColorThemeId: ColorThemeId = "default";

export const colorThemeStorageKey = "navio:color-theme";

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === "string" && (colorThemeIds as readonly string[]).includes(value);
}

export function getColorThemeOption(id: ColorThemeId): ColorThemeOption {
  return colorThemeOptions.find((option) => option.id === id) ?? colorThemeOptions[0];
}

/**
 * Runs before first paint so a saved theme never flashes the default color.
 * Only non-default themes set the attribute; the default palette needs none.
 */
export const colorThemeInitScript = `(function(){try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(colorThemeStorageKey)}));if(${JSON.stringify(colorThemeIds)}.indexOf(t)>0)document.documentElement.dataset.colorTheme=t}catch(e){}})();`;
