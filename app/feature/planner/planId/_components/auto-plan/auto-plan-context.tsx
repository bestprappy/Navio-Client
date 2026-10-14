"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { TripBlockData } from "../constants/types";
import { useDayAutoPlan, type DayAutoPlanState } from "./use-day-auto-plan";

const AutoPlanContext = createContext<DayAutoPlanState | null>(null);

export function useAutoPlanContext(): DayAutoPlanState {
  const context = useContext(AutoPlanContext);
  if (!context) {
    throw new Error("AutoPlan compound components must be rendered inside AutoPlan.Root.");
  }
  return context;
}

/** Holds one day's plan while the dialog is open; closing the dialog discards it. */
export function AutoPlanRoot({ block, children }: { block: TripBlockData; children: ReactNode }) {
  const state = useDayAutoPlan(block);
  return <AutoPlanContext.Provider value={state}>{children}</AutoPlanContext.Provider>;
}
