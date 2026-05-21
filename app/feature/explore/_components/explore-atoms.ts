import { atom } from "jotai";

export const shareDialogOpenAtom = atom(false);
export const shareDialogPlanIdAtom = atom<string | null>(null);
