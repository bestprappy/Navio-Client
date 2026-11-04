import type { EvOptimizationOperation } from "@/app/feature/planner/_components/planner-api";

import { formatMinutes } from "../garage/garage-formatters";

export function describeOperation(operation: EvOptimizationOperation): string {
  const chargerName = operation.charger?.name ?? "charger stop";
  switch (operation.type) {
    case "ADD_CHARGER":
      return `Add ${chargerName} (${formatMinutes(operation.estimatedChargeMinutes)})`;
    case "REPLACE_CHARGER":
      return `Replace the unlocked stop with ${chargerName}`;
    case "REMOVE_CHARGER":
      return "Remove an unnecessary unlocked charger";
    case "UPDATE_CHARGER":
      return `Refresh ${chargerName} and its charging estimate`;
  }
}

/** Sequence restarts on every leg, so type and sequence alone repeat across a day. */
export function operationKey(operation: EvOptimizationOperation, index: number): string {
  return `${operation.type}-${operation.oldItemId ?? operation.charger?.id ?? "stop"}-${index}`;
}
