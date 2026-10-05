import { flushPlannerAutosave } from "./planner-autosave-flush";
import { getPlannerSnapshot, PlannerApiError } from "./planner-api";

/** Old servers must not silently optimize without persisted canonical trip context. */
export async function prepareOptimizationSnapshot(tripId: string) {
  const version = await flushPlannerAutosave(tripId);
  if (version === null) throw new PlannerApiError("Wait for this planner to finish loading before optimizing.", 409);
  const snapshot = await getPlannerSnapshot(tripId);
  if (snapshot.version !== version) throw new PlannerApiError("The trip changed while preparing optimization. Try again.", 409);
  if (!snapshot.capabilities?.includes("canonical-optimization-v1")) {
    throw new PlannerApiError("Route optimization needs the canonical trip-state server update. Your itinerary remains unchanged.", 409);
  }
  return snapshot;
}

export function optimizationStateKey(payload: unknown, blocks: unknown, energyState: unknown, budget?: unknown): string {
  return JSON.stringify([payload, blocks, energyState, budget]);
}
