"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGarage } from "./garage-provider";
import { CustomVehicleForm } from "./custom-vehicle-form";
import { VehicleCatalogPicker } from "./vehicle-catalog-picker";
import type { CatalogVehicle, VehicleCommand } from "./vehicle-api";
import { defaultEnergyProfile } from "./energy-selection";


export function AddVehicleDialog({ onClose }: { onClose: () => void }) {
  const { mutation, authenticated, libraryVehicles } = useGarage();
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [selected, setSelected] = useState<CatalogVehicle | null>(null);
  const [libraryMode, setLibraryMode] = useState<"catalog" | "custom">("catalog");
  const customVehicles = libraryVehicles.filter(vehicle => vehicle.catalog === null);

  function selectVehicle(vehicle: CatalogVehicle) {
    setSelected(vehicle);

  }

  async function save(command: VehicleCommand | { kind: "reuse"; id: string }) {
    try {
      await mutation.mutateAsync(command);
      onClose();
    } catch {
      // TanStack Query retains the error and the form stays open for retry.
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl" showCloseButton={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>Add your EV</DialogTitle>
          <DialogDescription>{authenticated ? "Choose a published vehicle or enter your own. Vehicles are added to this trip; custom EVs stay in your personal list for reuse." : "Choose a published vehicle or enter your own specifications. This vehicle stays in your guest plan."}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2" aria-label="Vehicle source">
          <Button variant={mode === "catalog" ? "default" : "outline"} aria-pressed={mode === "catalog"} disabled={mutation.isPending} onClick={() => setMode("catalog")}>EV Vehicle List</Button>
          <Button variant={mode === "custom" ? "default" : "outline"} aria-pressed={mode === "custom"} disabled={mutation.isPending} onClick={() => setMode("custom")}>Custom EV</Button>
        </div>
        {mutation.isError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{mutation.error.message}</p>}
        {mode === "catalog" ? <form className="grid gap-4" onSubmit={(event) => {
          event.preventDefault();
          if (selected && !mutation.isPending) void save({ kind: "catalog", catalogId: selected.id, catalogVehicle: selected, energySelection: "USE_DEFAULT", startingBatteryPct: 80 });
        }}>
          <div className="flex gap-2" aria-label="Vehicle lists">
            <Button type="button" variant={libraryMode === "catalog" ? "default" : "outline"} onClick={() => setLibraryMode("catalog")}>NAVIO catalogue</Button>
            <Button type="button" variant={libraryMode === "custom" ? "default" : "outline"} onClick={() => setLibraryMode("custom")}>My custom EVs</Button>
          </div>
          {libraryMode === "catalog" ? <VehicleCatalogPicker selectedId={selected?.id ?? null} onSelect={selectVehicle} disabled={mutation.isPending} /> :
            <div className="grid gap-2">{customVehicles.length === 0 ? <p className="text-sm text-muted-foreground">No custom EVs saved yet.</p> : customVehicles.map(vehicle =>
              <Button key={vehicle.id} type="button" variant="outline" disabled={mutation.isPending} onClick={() => void save({ kind: "reuse", id: vehicle.id })}>{vehicle.nickname || `${vehicle.make} ${vehicle.model}`}</Button>)}</div>}
          {selected && libraryMode === "catalog" && <div className="grid gap-3 rounded-lg bg-muted/50 p-4">
            <p className="text-sm"><span className="font-semibold">{selected.make} {selected.model} {selected.trim}</span> · {selected.market}{selected.year ? ` · ${selected.year}` : " · Model year not published"}</p>
            <p className="text-xs text-muted-foreground">
              {selected.batteryCapacityKwh} kWh battery ({selected.batteryCapacityBasis.toLowerCase().replaceAll("_", " ")}).{" "}
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Specification source, checked {selected.verifiedAt}</a>
            </p>
            <p className="text-sm">{defaultEnergyProfile(selected, selected.rangeKm).modelKind === "CONSUMPTION"
              ? `Vehicle consumption: ${selected.energyProfile?.consumptionKwhPer100km} kWh/100 km`
              : `NAVIO Estimate: based on ${selected.rangeKm} km ${selected.rangeStandard}. Provisional; no consumption value is derived.`}</p>
          </div>}
          <p className="text-xs text-muted-foreground">Images may be illustrations. Appearance and equipment may vary by trim.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={libraryMode !== "catalog" || !selected || mutation.isPending}>{mutation.isPending ? "Saving…" : authenticated ? "Save to garage" : "Use for this trip"}</Button>
          </div>
        </form> : <CustomVehicleForm submitLabel={authenticated ? "Save custom EV" : "Use for this trip"} onSave={(vehicle) => save({ kind: "custom", vehicle })} onCancel={onClose} pending={mutation.isPending} />}
      </DialogContent>
    </Dialog>
  );
}
