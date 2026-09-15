import { atom, getDefaultStore } from "jotai";

import type { TripBlockData } from "../planId/_components/constants/types";

/** The last saved plan the user opened, kept outside the per-plan store so the sidebar can show it on other pages. */
export type RecentPlanSidebar = {
  planId: string;
  href: string;
  ownerId: string;
  blocks: TripBlockData[];
};

// Planner pages run inside an isolated Jotai Provider; these atoms must live in the default store.
export const recentPlanSidebarStore = getDefaultStore();
export const recentPlanSidebarAtom = atom<RecentPlanSidebar | null>(null);
/** Block to reveal once the recent plan opens, set when a day is picked from outside the planner. */
export const pendingPlannerBlockIdAtom = atom<string | null>(null);
