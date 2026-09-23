"use client";

import { useId, useState } from "react";
import { useAtomValue } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { EvCar } from "../constants/vehicle.types";
import { BatteryInput } from "./battery-gauge";
import { calcRangeKmForBatteryPct } from "./ev-calculator";
import { arrivalReservePctAtom } from "./garage.atoms";
import { BATTERY_TONES, getBatteryTone } from "./garage-formatters";
import { useGarage } from "./garage-provider";
import { RangeEfficiencyField } from "./range-efficiency-field";
import type { SavedVehicle } from "./vehicle-api";

export function VehicleSettingsForm({ vehicle, car }: { vehicle: SavedVehicle; car?: EvCar | null }) {
  const [battery, setBattery] = useState(vehicle.settings.startingBatteryPct);
  const [consumption, setConsumption] = useState(vehicle.consumptionKwhPer100km?.toString() ?? "");
  const reservePct = useAtomValue(arrivalReservePctAtom);
  const rangeId = useId();
  const { mutation, authenticated, query } = useGarage();
  const valid = Number.isFinite(Number(consumption)) && Number(consumption) > 0 && Number(consumption) <= 99999.999;
  const dirty = battery !== vehicle.settings.startingBatteryPct || Number(consumption) !== vehicle.consumptionKwhPer100km;
  const tone = BATTERY_TONES[getBatteryTone(battery, reservePct)];
  // Preview with the consumption being edited, so the range reacts before saving.
  const previewCar = car && valid ? { ...car, consumptionKwhPer100km: Number(consumption) } : car;
  const rangeKm = previewCar ? Math.round(calcRangeKmForBatteryPct(battery, previewCar)) : null;

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || mutation.isPending) return;
        mutation.mutate({ kind: "update", id: vehicle.id, patch: {
          consumptionKwhPer100km: Number(consumption), settings: { startingBatteryPct: battery },
        } });
      }}
    >
      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <label htmlFor="starting-battery" className="text-sm font-medium text-foreground">Starting battery</label>
          <p className="flex items-baseline gap-2">
            {rangeKm !== null && (
              <span id={rangeId} className="text-xs text-muted-foreground">
                about <span className="font-medium tabular-nums text-foreground">{rangeKm.toLocaleString("en-US")} km</span> of range
              </span>
            )}
            <span className={cn("text-2xl font-semibold leading-none tabular-nums", tone.valueText)}>
              {battery}
              <span className="text-sm font-medium text-muted-foreground">%</span>
            </span>
          </p>
        </div>
        <BatteryInput
          id="starting-battery"
          value={battery}
          onChange={setBattery}
          reservePct={reservePct}
          disabled={mutation.isPending}
          ariaDescribedBy={rangeKm !== null ? rangeId : undefined}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Drag the battery or use the arrow keys. The dashed line is your {reservePct}% arrival reserve.
        </p>
      </div>

      <RangeEfficiencyField
        id="saved-vehicle-range"
        batteryKwh={vehicle.batteryCapacityKwh}
        officialRangeKm={vehicle.rangeKm}
        rangeStandard={vehicle.catalog?.rangeStandard}
        consumption={consumption}
        onConsumptionChange={setConsumption}
        disabled={mutation.isPending}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {dirty ? "Apply changes to update route estimates." : authenticated ? "Settings saved to your account." : "Settings used only for this guest plan."}
        </p>
        <Button type="submit" disabled={!dirty || !valid || mutation.isPending || (authenticated && query.isError)}>
          {mutation.isPending ? "Applying…" : authenticated ? "Save settings" : "Apply to trip"}
        </Button>
      </div>
    </form>
  );
}
