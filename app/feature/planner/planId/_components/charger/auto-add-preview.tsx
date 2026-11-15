"use client";
import type { EvOptimizationPreview } from "@/app/feature/planner/_components/planner-api";

import { isPlaceItem, type TripBlockData } from "../constants/types";
import { BATTERY_TONES, formatMinutes, getBatteryTone, BATTERY_CRITICAL_PCT } from "../garage/garage-formatters";
import { describeOperation, operationKey } from "./ev-optimization-format";

type AutoAddPreviewProps = {
  preview: EvOptimizationPreview;
  day: TripBlockData | undefined;
};

function Pct({ value }: { value: number }) {
  return (
    <span className={`font-medium tabular-nums ${BATTERY_TONES[getBatteryTone(value, BATTERY_CRITICAL_PCT)].valueText}`}>
      {Math.round(value)}%
    </span>
  );
}

/** The charging stops Auto Add will insert, in the order they appear on the day's route. */
export function AutoAddPreview({ preview, day }: AutoAddPreviewProps) {
  const nameOf = (itemId: string | null) => {
    const item = itemId ? day?.items.find((candidate) => candidate.id === itemId) : undefined;
    return item && isPlaceItem(item) ? item.name : null;
  };
  const operations = preview.operations;

  if (operations.length === 0 || !preview.feasible) {
    return <p className="mt-3 text-xs leading-5 text-muted-foreground">{preview.message}</p>;
  }

  return (
    <div className="mt-4">
      <ol aria-label="Charging stops to add" className="space-y-3 border-l-2 border-primary/30 pl-3">
        {operations.map((operation, index) => {
          const before = nameOf(operation.beforeItemId);
          if (operation.type !== "ADD_CHARGER") {
            return (
              <li key={operationKey(operation, index)} className="text-xs text-foreground">
                {describeOperation(operation)}
              </li>
            );
          }
          return (
            <li key={operationKey(operation, index)} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[calc(0.75rem+5px)] size-2 rounded-full bg-primary ring-2 ring-card"
              />
              <p className="text-sm font-medium leading-5 text-foreground">{operation.charger?.name ?? "Charging stop"}</p>
              {before ? <p className="text-xs text-muted-foreground">Before {before}</p> : null}
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                  <Pct value={operation.arrivalSocPct} /> to <Pct value={operation.departureSocPct} />
                </span>
                <span>{formatMinutes(operation.estimatedChargeMinutes)} charging</span>
                {operation.detourKm >= 0.1 ? <span>{operation.detourKm.toFixed(1)} km detour</span> : null}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {preview.finalSocPct === null ? (
          "The battery at the end of the day could not be predicted."
        ) : (
          <>
            The day ends at <Pct value={preview.finalSocPct} />
            {preview.totalChargingMinutes > 0 ? ` after ${formatMinutes(preview.totalChargingMinutes)} of charging.` : "."}
          </>
        )}
      </p>
      {preview.warnings.map((warning) => (
        <p key={warning} className="mt-1 text-xs leading-5 text-warning">
          {warning}
        </p>
      ))}
    </div>
  );
}
