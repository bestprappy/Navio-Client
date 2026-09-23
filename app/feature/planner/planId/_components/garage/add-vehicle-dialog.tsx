"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGarage } from "./garage-provider";
import { CustomVehicleForm } from "./custom-vehicle-form";
import { VehicleCatalogPicker } from "./vehicle-catalog-picker";
import type { CatalogVehicle, VehicleCommand } from "./vehicle-api";
import { estimateCatalogConsumption } from "./vehicle-mappers";
import { RangeEfficiencyField } from "./range-efficiency-field";

export function AddVehicleDialog({ onClose }: { onClose: () => void }) {
  const { mutation, authenticated } = useGarage();
  const [mode, setMode] = useState<"catalog" | "custom">(authenticated ? "catalog" : "custom");
  const [selected, setSelected] = useState<CatalogVehicle | null>(null);
  const [consumption, setConsumption] = useState("");
  const consumptionToSave = Number(consumption);
  const validConsumption = consumption !== "" && Number.isFinite(consumptionToSave) && consumptionToSave > 0 && consumptionToSave <= 99999.999;

  function selectVehicle(vehicle: CatalogVehicle) {
    setSelected(vehicle);
    // Start from the real-world estimate; the driver can replace it with their own range.
    setConsumption(String(estimateCatalogConsumption(vehicle)));
  }

  async function save(command: VehicleCommand) {
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
          <DialogDescription>{authenticated ? "Choose a Thailand specification or enter your own. Your garage is saved to your account." : "Enter your EV specifications for this guest plan. This vehicle will not be saved."}</DialogDescription>
        </DialogHeader>
        {authenticated && <div className="flex gap-2" aria-label="Vehicle source">
          <Button variant={mode === "catalog" ? "default" : "outline"} aria-pressed={mode === "catalog"} disabled={mutation.isPending} onClick={() => setMode("catalog")}>Thailand catalogue</Button>
          <Button variant={mode === "custom" ? "default" : "outline"} aria-pressed={mode === "custom"} disabled={mutation.isPending} onClick={() => setMode("custom")}>Custom EV</Button>
        </div>}
        {mutation.isError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{mutation.error.message}</p>}
        {mode === "catalog" ? <form className="grid gap-4" onSubmit={(event) => {
          event.preventDefault();
          if (selected && validConsumption && !mutation.isPending) void save({ kind: "catalog", catalogId: selected.id, consumptionKwhPer100km: consumptionToSave, startingBatteryPct: 80 });
        }}>
          <VehicleCatalogPicker selectedId={selected?.id ?? null} onSelect={selectVehicle} disabled={mutation.isPending} />
          {selected && <div className="grid gap-3 rounded-lg bg-muted/50 p-4">
            <p className="text-sm"><span className="font-semibold">{selected.make} {selected.model} {selected.trim}</span> · Thailand{selected.year ? ` · ${selected.year}` : " · Model year not published"}</p>
            <p className="text-xs text-muted-foreground">
              {selected.batteryCapacityKwh} kWh battery as declared by the manufacturer.{" "}
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Official specification, checked {selected.verifiedAt}</a>
            </p>
            <RangeEfficiencyField
              key={selected.id}
              id="preset-range"
              batteryKwh={selected.batteryCapacityKwh}
              officialRangeKm={selected.rangeKm}
              rangeStandard={selected.rangeStandard}
              consumption={consumption}
              onConsumptionChange={setConsumption}
              disabled={mutation.isPending}
            />
          </div>}
          <p className="text-xs text-muted-foreground">Car images are AI illustrations. Appearance and equipment may vary by trim.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={!selected || !validConsumption || mutation.isPending}>{mutation.isPending ? "Saving…" : "Save to garage"}</Button>
          </div>
        </form> : <CustomVehicleForm submitLabel={authenticated ? "Save custom EV" : "Use for this trip"} onSave={(vehicle) => save({ kind: "custom", vehicle })} onCancel={onClose} pending={mutation.isPending} />}
      </DialogContent>
    </Dialog>
  );
}
