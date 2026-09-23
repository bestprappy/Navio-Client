"use client";

import { useId, useState } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BatterySlider } from "./battery-slider";
import { useGarage } from "./garage-provider";
import type { SavedVehicle } from "./vehicle-api";
import { defaultEnergyProfile, isLegacyVehicle } from "./energy-selection";
import { userObservedConsumption } from "./vehicle-api";
import { tripEnergyStateAtom } from "./trip-energy-state";

type Selection = "RESET_DEFAULT" | "USE_RATED_RANGE" | "USER_OVERRIDE" | "";

export function VehicleSettingsForm({ vehicle }: { vehicle: SavedVehicle }) {
  const [tripEnergy, setTripEnergy] = useAtom(tripEnergyStateAtom);
  const battery = tripEnergy?.initialSocPct ?? vehicle.settings.startingBatteryPct;
  const [nickname, setNickname] = useState(vehicle.nickname ?? "");
  const [consumption, setConsumption] = useState(vehicle.consumptionKwhPer100km?.toString() ?? "");
  const initialSelection: Selection = isLegacyVehicle(vehicle) ? "" : vehicle.energyProfile?.selectionMode === "USER_OVERRIDE"
    ? "USER_OVERRIDE" : vehicle.energyProfile?.modelKind === "RATED_RANGE" ? "USE_RATED_RANGE"
    : vehicle.energyProfile?.modelKind === "CONSUMPTION" ? "RESET_DEFAULT" : "";
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [selectionChanged, setSelectionChanged] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const infoId = useId();
  const direct = defaultEnergyProfile(vehicle.catalog, vehicle.rangeKm);
  const range = defaultEnergyProfile(vehicle.catalog, vehicle.rangeKm, true);
  const { mutation, authenticated, query } = useGarage();
  const energyDirty = selectionChanged || (selection === "USER_OVERRIDE" && consumption !== vehicle.consumptionKwhPer100km?.toString());
  const valid = selection === "RESET_DEFAULT" ? direct.modelKind === "CONSUMPTION"
    : selection === "USE_RATED_RANGE" ? range.modelKind === "RATED_RANGE"
    : selection !== "USER_OVERRIDE" || (Number.isFinite(Number(consumption)) && Number(consumption) > 0 && Number(consumption) <= 99999.999);
  const dirty = nickname !== (vehicle.nickname ?? "") || energyDirty;
  return (
    <form className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!dirty || !valid || mutation.isPending) return;
      mutation.mutate({ kind: "update", id: vehicle.id, patch: {
        nickname,
        ...(energyDirty && selection ? selection === "USER_OVERRIDE" ? {
          energySelection: "USER_OVERRIDE", consumptionKwhPer100km: Number(consumption), consumptionProvenance: userObservedConsumption,
        } : { energySelection: selection } : {}),
      } });
    }}>
      <div className="flex items-center justify-between gap-3"><label htmlFor="starting-battery" className="text-sm font-medium">Starting battery</label><span className="text-sm font-semibold tabular-nums">{battery}%</span></div>
      <BatterySlider id="starting-battery" value={battery} onChange={(value) => setTripEnergy((current) => ({ initialSocPct: value, vehicleSnapshot: current?.vehicleSnapshot ?? null }))} />
      <p className="text-xs text-muted-foreground">Battery at the start of Day 1. Updates this trip immediately. {tripEnergy?.initialSocPct == null && "Using an assumed starting value until you adjust it."}</p>
      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2 content-start"><label htmlFor="saved-vehicle-nickname" className="text-sm font-medium">Nickname (Optional)</label><Input id="saved-vehicle-nickname" maxLength={100} value={nickname} onChange={(event) => setNickname(event.target.value)} disabled={mutation.isPending} /></div>
        <div className="grid min-w-0 gap-2">
          <label htmlFor="energy-selection" className="text-sm font-medium">Energy Consumption</label>
          <select id="energy-selection" className="w-full min-w-0 rounded-md border border-input bg-background p-2 text-sm" value={selection}
            disabled={mutation.isPending} onChange={(event) => { setSelection(event.target.value as Selection); setSelectionChanged(true); }}>
            {!initialSelection && <option value="" disabled hidden>Choose an energy model</option>}
            <option value="RESET_DEFAULT" disabled={direct.modelKind !== "CONSUMPTION"}>Vehicle Default</option>
            <option value="USE_RATED_RANGE" disabled={range.modelKind !== "RATED_RANGE"}>NAVIO Estimate</option>
            <option value="USER_OVERRIDE">Custom</option>
          </select>
          <div className="relative flex items-center gap-2 text-xs text-muted-foreground" onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)}>
            <span>NAVIO Estimate</span>
            <button type="button" aria-label="About NAVIO Estimate" aria-describedby={showInfo ? infoId : undefined}
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border font-semibold focus-visible:outline-2 focus-visible:outline-ring"
              onFocus={() => setShowInfo(true)} onBlur={() => setShowInfo(false)} onClick={() => setShowInfo(true)} onKeyDown={(event) => { if (event.key === "Escape") setShowInfo(false); }}>i</button>
            {showInfo && <p id={infoId} role="tooltip" className="absolute right-0 top-full z-20 mt-1 w-64 max-w-full rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">A provisional NAVIO planning estimate based on the vehicle?s rated range. Real-world driving may differ. It does not provide a measured consumption value or enable automatic charger planning.</p>}
          </div>
          {selection === "RESET_DEFAULT" && direct.modelKind === "CONSUMPTION" && <>
            <label htmlFor="default-consumption" className="text-sm">Vehicle consumption (kWh/100 km)</label>
            <Input id="default-consumption" readOnly value={direct.consumptionKwhPer100km ?? ""} />
          </>}
          {selection === "USE_RATED_RANGE" && <p role="status" className="text-sm">Based on {range.ratedRangeKm} km{range.ratedRangeStandard === "NONE" ? "" : ` ${range.ratedRangeStandard}`}</p>}
          {selection === "USER_OVERRIDE" && <>
            <label htmlFor="saved-vehicle-consumption" className="text-sm font-medium">Your average (kWh/100 km)</label>
            <Input id="saved-vehicle-consumption" type="number" min="0.001" max="99999.999" step="0.001" required value={consumption} onChange={(event) => setConsumption(event.target.value)} disabled={mutation.isPending} />
          </>}
          {direct.modelKind !== "CONSUMPTION" && <p className="text-xs text-muted-foreground">Vehicle Default is unavailable: no suitable direct consumption specification.</p>}
        </div>
      </div>
      {isLegacyVehicle(vehicle) && <p className="text-xs text-muted-foreground">Existing estimate: {vehicle.consumptionKwhPer100km ?? "unavailable"}{vehicle.consumptionKwhPer100km !== null ? " kWh/100 km" : ""}. Its source is unknown. It stays unchanged until you choose an energy model and save. Automatic charger application remains unavailable for an unconfirmed legacy estimate.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{dirty ? "Save to apply nickname and consumption changes." : authenticated ? "Vehicle settings saved to your account." : "Vehicle settings used only for this guest trip."}</p><Button type="submit" disabled={!dirty || !valid || mutation.isPending || (authenticated && query.isError)}>{mutation.isPending ? "Saving?" : "Save settings"}</Button></div>
    </form>
  );
}
