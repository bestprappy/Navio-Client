import { atom } from "jotai";
import type { DateRange } from "react-day-picker";

import type { Destination } from "./data";

export const destinationQueryAtom = atom("");
export const selectedDestinationAtom = atom<Destination | null>(null);
export const destinationSearchOpenAtom = atom(false);
export const destinationActiveIndexAtom = atom(0);
export const destinationValidationErrorAtom = atom<string | null>(null);
export const plannerDateRangeAtom = atom<DateRange | undefined>(undefined);
export const isSelectingDestinationAtom = atom(false);
export const isCreatingTripAtom = atom(false);

export const canSubmitPlannerAtom = atom(
  (get) =>
    get(selectedDestinationAtom) !== null &&
    !get(isSelectingDestinationAtom) &&
    !get(isCreatingTripAtom),
);
