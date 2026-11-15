import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { RouteStrategy } from "./day-route-optimization";
import type { TripBlockData } from "../constants/types";

/** One reversible change per day; survives closing the settings dialog. */
export const dayAutomationHistoryAtom = atom<Record<string, { before: TripBlockData; after: string }>>({});
export const routeStrategyAtom = atomWithStorage<RouteStrategy>("navio:route-strategy", "backtracking");
export const flexibleChargingAtom = atomWithStorage("navio:flexible-charging", false);
