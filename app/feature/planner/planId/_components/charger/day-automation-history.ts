import { atom } from "jotai";
import type { TripBlockData } from "../constants/types";

/** One reversible Auto Add change per day. */
export const dayAutomationHistoryAtom = atom<Record<string, { before: TripBlockData; after: string }>>({});
