import { atomWithStorage } from "jotai/utils";

export type HandoutOptions = {
  /** A guide's or company's name, printed at the top of the handout. */
  preparedBy: string;
  showNotes: boolean;
  showPhotos: boolean;
  showTravel: boolean;
  showCosts: boolean;
  /** Start each day after the first on a new page. */
  dayPerPage: boolean;
};

export const DEFAULT_HANDOUT_OPTIONS: HandoutOptions = {
  preparedBy: "",
  showNotes: true,
  showPhotos: true,
  showTravel: true,
  // Off by default: a handout is often given to travellers on a priced package.
  showCosts: false,
  dayPerPage: true,
};

/** Remembered on this device, so a guide's name and choices carry to the next trip. */
export const handoutOptionsAtom = atomWithStorage<HandoutOptions>(
  "navio:itinerary-handout-options",
  DEFAULT_HANDOUT_OPTIONS,
  undefined,
  { getOnInit: true },
);

/** Stored options may be from an older version or edited by hand; keep only valid values. */
export function normalizeHandoutOptions(value: unknown): HandoutOptions {
  if (typeof value !== "object" || value === null) return DEFAULT_HANDOUT_OPTIONS;
  const stored = value as Partial<Record<keyof HandoutOptions, unknown>>;
  const flag = (key: Exclude<keyof HandoutOptions, "preparedBy">): boolean => {
    const flagValue = stored[key];
    return typeof flagValue === "boolean" ? flagValue : DEFAULT_HANDOUT_OPTIONS[key];
  };
  return {
    preparedBy: typeof stored.preparedBy === "string" ? stored.preparedBy.slice(0, 120) : "",
    showNotes: flag("showNotes"),
    showPhotos: flag("showPhotos"),
    showTravel: flag("showTravel"),
    showCosts: flag("showCosts"),
    dayPerPage: flag("dayPerPage"),
  };
}
