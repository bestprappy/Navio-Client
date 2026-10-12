import type { TripBlockData } from "../constants/types";
import type { CanonicalDayProjection } from "./trip-energy-projection";
import { energyDisplayNumber } from "./energy-display";
import { formatCheckedDate } from "./garage-formatters";

export function TripEnergyDetails({ blocks, days }: {
  blocks: TripBlockData[];
  days?: Map<string, CanonicalDayProjection>;
}) {
  return (
    <details className="border-t border-border p-4">
      <summary className="cursor-pointer rounded-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">Daily energy details</summary>
      <p className="mt-2 text-xs text-muted-foreground">Nominal predictions carry forward across days. Observed battery levels update subsequent predictions; they do not imply charging. Reserve is a planning threshold, not an uncertainty allowance.</p>
      <ol className="mt-3 space-y-3">
        {blocks.toSorted((a, b) => a.date.localeCompare(b.date)).map((block, index) => {
          const day = days?.get(block.id);
          const observations = [...(day?.batteryByItemId.entries() ?? [])].filter(([, state]) => state.observedSocPct != null);
          return <li key={block.id} className="rounded-md border border-border p-3 text-xs">
            <p className="font-medium">Day {index + 1} · {formatCheckedDate(block.date)}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              <div><dt className="text-muted-foreground">Planned distance</dt><dd>{energyDisplayNumber(day?.distanceKm, " km")}</dd></div>
              <div><dt className="text-muted-foreground">Driving energy</dt><dd>{energyDisplayNumber(day?.energyKwh, " kWh")}</dd></div>
              <div><dt className="text-muted-foreground">Starting battery</dt><dd>{energyDisplayNumber(day?.startBatteryPct, "%")}</dd></div>
              <div><dt className="text-muted-foreground">End battery estimate</dt><dd>{energyDisplayNumber(day?.finalBatteryPct, "%")}</dd></div>
              <div><dt className="text-muted-foreground">Charging duration</dt><dd>{energyDisplayNumber(day?.chargeMinutes, " min")}</dd></div>
              <div><dt className="text-muted-foreground">Energy added</dt><dd>{energyDisplayNumber(day?.chargeEnergyKwh, " kWh")}</dd></div>
            </dl>
            {day?.predictedBelowReserve && <p className="mt-2 text-destructive">Predicted arrival below reserve.</p>}
            {day?.infeasible && <p className="mt-2 text-destructive">At least one leg is predicted to exceed available battery.</p>}
            {observations.map(([id, state]) => {
              const item = block.items.find(item => item.id === id);
              return <p key={id} className="mt-2 break-words text-muted-foreground">
                {item?.type === "place" ? item.name : "Battery checkpoint"}: predicted arrival {energyDisplayNumber(state.rawPredictedArrivalSocPct, "%")}; user-observed {energyDisplayNumber(state.observedSocPct, "%")}.
              </p>;
            })}
          </li>;
        })}
      </ol>
    </details>
  );
}
