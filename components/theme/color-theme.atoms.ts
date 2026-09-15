import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  type ColorThemeId,
  colorThemeStorageKey,
  defaultColorThemeId,
  isColorThemeId,
} from "./color-themes";

// Stored as a plain string so a stale or hand-edited value can be rejected on read.
const storedColorThemeAtom = atomWithStorage<string>(
  colorThemeStorageKey,
  defaultColorThemeId,
  undefined,
  { getOnInit: true },
);

function applyColorTheme(id: ColorThemeId) {
  const root = document.documentElement;
  if (id === defaultColorThemeId) {
    delete root.dataset.colorTheme;
  } else {
    root.dataset.colorTheme = id;
  }
}

export const colorThemeAtom = atom(
  (get): ColorThemeId => {
    const stored = get(storedColorThemeAtom);
    return isColorThemeId(stored) ? stored : defaultColorThemeId;
  },
  (_get, set, next: ColorThemeId) => {
    applyColorTheme(next);
    try {
      set(storedColorThemeAtom, next);
    } catch (error) {
      // Private browsing can block storage; the theme still applies for this visit.
      console.error("colorThemeAtom: could not persist color theme", { next, error });
    }
  },
);
