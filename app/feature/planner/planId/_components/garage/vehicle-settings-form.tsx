"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BatterySlider } from "./battery-slider";
import { useGarage } from "./garage-provider";
import type { SavedVehicle } from "./vehicle-api";

export function VehicleSettingsForm({ vehicle }: { vehicle: SavedVehicle }) {
  const [battery, setBattery] = useState(vehicle.settings.startingBatteryPct);
  const [nickname, setNickname] = useState(vehicle.nickname ?? "");
  const [consumption, setConsumption] = useState(vehicle.consumptionKwhPer100km?.toString() ?? "");
  const { mutation, authenticated, query } = useGarage();
  const valid = Number.isFinite(Number(consumption)) && Number(consumption) > 0 && Number(consumption) <= 99999.999;
  const dirty = battery !== vehicle.settings.startingBatteryPct || nickname !== (vehicle.nickname ?? "") || Number(consumption) !== vehicle.consumptionKwhPer100km;
  return (
    <form className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!valid || mutation.isPending) return;
      mutation.mutate({ kind: "update", id: vehicle.id, patch: {
        nickname, consumptionKwhPer100km: Number(consumption), settings: { startingBatteryPct: battery },
      } });
    }}>
      <div className="flex items-center justify-between gap-3"><label htmlFor="starting-battery" className="text-sm font-medium">Starting battery</label><span className="text-sm font-semibold tabular-nums">{battery}%</span></div>
      <BatterySlider id="starting-battery" value={battery} onChange={setBattery} disabled={mutation.isPending} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><label htmlFor="saved-vehicle-nickname" className="text-sm font-medium">Nickname</label><Input id="saved-vehicle-nickname" maxLength={100} value={nickname} onChange={(event) => setNickname(event.target.value)} disabled={mutation.isPending} /></div>
        <div className="grid gap-2"><label htmlFor="saved-vehicle-consumption" className="text-sm font-medium">Consumption (kWh/100 km)</label><Input id="saved-vehicle-consumption" type="number" min="0.001" max="99999.999" step="0.001" required value={consumption} onChange={(event) => setConsumption(event.target.value)} disabled={mutation.isPending} /></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{dirty ? "Unsaved changes. Save to update route estimates." : "Settings saved to your account."}</p><Button type="submit" disabled={!dirty || !valid || mutation.isPending || !authenticated || query.isError}>{mutation.isPending ? "Saving…" : "Save settings"}</Button></div>
    </form>
  );
}
