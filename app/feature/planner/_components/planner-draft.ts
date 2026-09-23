import { tripEnergyStateSchema, type TripEnergyState } from "../planId/_components/garage/trip-energy-state";
import { isPlannerBlocks, isTripBudgetState } from "./planner-api";
import { defaultTripBudget } from "../planId/_components/budget/budget.data";
import type { TripBudgetState } from "../planId/_components/budget/budget.types";
import type { TripBlockData } from "../planId/_components/constants/types";

const PLANNER_DRAFT_STORAGE_PREFIX = "navio:planner-draft:v1:";
type PlannerState = { energyState?: TripEnergyState | null; blocks: TripBlockData[]; budget: TripBudgetState };
export type PlannerDraft = PlannerState & { version: number; updatedAt: string };

export function readPlannerDraft(planId: string): PlannerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const rawDraft = window.localStorage.getItem(plannerDraftStorageKey(planId));
    if (!rawDraft) return null;

    const value: unknown = JSON.parse(rawDraft);
    if (
      !value ||
      typeof value !== "object" ||
      !("version" in value) ||
      typeof value.version !== "number" ||
      !("blocks" in value) ||
      !isPlannerBlocks(value.blocks) ||
      !("updatedAt" in value) ||
      typeof value.updatedAt !== "string"
    ) {
      clearPlannerDraft(planId);
      return null;
    }
    const budget =
      "budget" in value && isTripBudgetState(value.budget)
        ? value.budget
        : defaultTripBudget;
    const energyState = "energyState" in value ? value.energyState === null ? null : tripEnergyStateSchema.parse(value.energyState) : undefined;
    return {
      energyState,
      version: value.version,
      blocks: value.blocks,
      budget,
      updatedAt: value.updatedAt,
    };
  } catch (error) {
    console.warn("Planner draft could not be read.", { planId, error });
    return null;
  }
}

export function writePlannerDraft(
  planId: string,
  version: number,
  state: PlannerState,
): boolean {
  try {
    const draft: PlannerDraft = {
      version,
      blocks: state.blocks,
      energyState: state.energyState,
      budget: state.budget,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(plannerDraftStorageKey(planId), JSON.stringify(draft));
    return true;
  } catch (error) {
    console.warn("Planner draft could not be stored.", { planId, error });
    return false;
  }
}

export function clearPlannerDraft(planId: string): void {
  try {
    window.localStorage.removeItem(plannerDraftStorageKey(planId));
  } catch (error) {
    console.warn("Planner draft could not be cleared.", { planId, error });
  }
}

function plannerDraftStorageKey(planId: string): string {
  return `${PLANNER_DRAFT_STORAGE_PREFIX}${planId}`;
}
