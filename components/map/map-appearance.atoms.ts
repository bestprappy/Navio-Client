import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { defaultMapAppearance, mapAppearanceStorageKey, normalizeMapAppearance, type MapAppearance } from "./map-appearance";

// Read storage after mounting so server/client first renders agree.
const storedMapAppearanceAtom = atomWithStorage<unknown>(mapAppearanceStorageKey, defaultMapAppearance);

export const mapAppearanceAtom = atom(
  (get) => normalizeMapAppearance(get(storedMapAppearanceAtom)),
  (_get, set, next: MapAppearance) => {
    // atomWithStorage updates the in-memory value before attempting persistence.
    try {
      set(storedMapAppearanceAtom, normalizeMapAppearance(next));
    } catch {
      // Storage may be disabled; this visit can still use the chosen appearance.
    }
  },
);
