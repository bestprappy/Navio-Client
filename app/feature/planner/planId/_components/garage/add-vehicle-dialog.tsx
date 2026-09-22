"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGarage } from "./garage-provider";
import { CustomVehicleForm } from "./custom-vehicle-form";
import { VehicleCatalogPicker } from "./vehicle-catalog-picker";
import type { CatalogVehicle, VehicleCommand } from "./vehicle-api";
import { userObservedConsumption } from "./vehicle-api";
import { defaultEnergyProfile, energySelectionDescription } from "./energy-selection";

export function AddVehicleDialog({ onClose }: { onClose: () => void }) {
  const { mutation, authenticated } = useGarage();
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [selected, setSelected] = useState<CatalogVehicle | null>(null);
  const [knowsConsumption, setKnowsConsumption] = useState(false);
  const [consumption, setConsumption] = useState("");
  const defaultProfile = selected ? defaultEnergyProfile(selected, selected.rangeKm) : null;
  const consumptionToSave = knowsConsumption ? Number(consumption) : undefined;
  const validConsumption = !knowsConsumption || (consumptionToSave !== undefined && Number.isFinite(consumptionToSave) && consumptionToSave > 0 && consumptionToSave <= 99999.999);

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
          <DialogDescription>{authenticated ? "Choose a Thailand specification or enter your own. Your garage is saved to your account." : "Choose a catalogue EV or enter your own specifications. Used only for this guest trip."}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2" aria-label="Vehicle source">
          <Button variant={mode === "catalog" ? "default" : "outline"} aria-pressed={mode === "catalog"} disabled={mutation.isPending} onClick={() => setMode("catalog")}>Thailand catalogue</Button>
          <Button variant={mode === "custom" ? "default" : "outline"} aria-pressed={mode === "custom"} disabled={mutation.isPending} onClick={() => setMode("custom")}>Custom EV</Button>
        </div>
        {mutation.isError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{mutation.error.message}</p>}
        {mode === "catalog" ? <form className="grid gap-4" onSubmit={(event) => {
          event.preventDefault();
          if (selected && validConsumption && !mutation.isPending) void save({ kind: "catalog", catalogId: selected.id, consumptionKwhPer100km: consumptionToSave, startingBatteryPct: 80,
            energySelection: knowsConsumption ? "USER_OVERRIDE" : "USE_DEFAULT",
            catalogVehicle: selected,
            ...(knowsConsumption ? { consumptionProvenance: userObservedConsumption } : {}),
          });
        }}>
          <VehicleCatalogPicker selectedId={selected?.id ?? null} onSelect={setSelected} disabled={mutation.isPending} />
          {selected && <div className="grid gap-3 rounded-lg bg-muted/50 p-4">
            <p className="text-sm"><span className="font-semibold">{selected.make} {selected.model} {selected.trim}</span> · Thailand{selected.year ? ` · ${selected.year}` : " · Model year not published"}</p>
            <p className="text-xs text-muted-foreground">{selected.rangeKm} km is the official {selected.rangeStandard} test range. Battery capacity is manufacturer declared; usable capacity is not confirmed. Actual range varies.</p>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-4">Official specification · checked {selected.verifiedAt}</a>
            <div className="flex items-start gap-3">
              <Checkbox id="preset-knows-consumption" checked={knowsConsumption} onCheckedChange={setKnowsConsumption}
                disabled={mutation.isPending} aria-describedby="preset-consumption-help" className="mt-0.5" />
              <label htmlFor="preset-knows-consumption" className="text-sm font-medium">I know my car&apos;s average consumption</label>
            </div>
            {knowsConsumption && <>
              <label htmlFor="preset-consumption" className="text-sm font-medium">Your average consumption (kWh/100 km)</label>
              <Input id="preset-consumption" type="number" min="0.001" max="99999.999" step="0.001" required value={consumption}
                onChange={(event) => setConsumption(event.target.value)} disabled={mutation.isPending} aria-describedby="preset-consumption-help" />
            </>}
            <p id="preset-consumption-help" className="text-xs text-muted-foreground">
              {knowsConsumption
                ? "Enter your observed average. Its measurement basis remains unknown unless explicitly specified."
                : defaultProfile ? energySelectionDescription(defaultProfile) : "Choose a vehicle."}
            </p>
          </div>}
          <p className="text-xs text-muted-foreground">Car images are AI illustrations. Appearance and equipment may vary by trim.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={!selected || !validConsumption || mutation.isPending}>{mutation.isPending ? "Adding…" : authenticated ? "Save to garage" : "Use for this trip"}</Button>
          </div>
        </form> : <CustomVehicleForm submitLabel={authenticated ? "Save custom EV" : "Use for this trip"} onSave={(vehicle) => save({ kind: "custom", vehicle })} onCancel={onClose} pending={mutation.isPending} />}
      </DialogContent>
    </Dialog>
  );
}
