"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listVehicleCatalog, type CatalogVehicle } from "./vehicle-api";
import { catalogVehicleCar } from "./vehicle-mappers";
import { VehicleMedia } from "./vehicle-media";

type VehicleCatalogPickerProps = {
  selectedId: string | null;
  onSelect: (vehicle: CatalogVehicle) => void;
  disabled: boolean;
};

export function VehicleCatalogPicker({ selectedId, onSelect, disabled }: VehicleCatalogPickerProps) {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["vehicle-catalog", "TH"], queryFn: ({ signal }) => listVehicleCatalog(signal), staleTime: 300_000, retry: 1 });
  const vehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? []).filter((vehicle) =>
      `${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.year ?? ""}`.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  return (
    <div className="grid gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9"
          placeholder="Search make, model or trim" aria-label="Search Thailand vehicles" />
      </div>
      {query.isPending ? <p role="status" className="flex items-center gap-2 py-4 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading Thailand vehicles…</p>
        : query.isError ? <div role="alert" className="grid gap-2"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div>
        : vehicles.length === 0 ? <p role="status" className="py-4 text-muted-foreground">No matching vehicles. Try another search or enter a custom EV.</p>
        : <fieldset disabled={disabled} className="grid max-h-80 gap-3 overflow-y-auto p-1">
          <legend className="sr-only">Thailand vehicle catalogue</legend>
          {vehicles.map((vehicle) => (
            <label key={vehicle.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring",
              selectedId === vehicle.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50", disabled && "cursor-wait opacity-70")}>
              <input type="radio" name="catalog-vehicle" value={vehicle.id} checked={selectedId === vehicle.id}
                onChange={() => onSelect(vehicle)} className="size-4 shrink-0 accent-primary" />
              <VehicleMedia car={catalogVehicleCar(vehicle)} compact className="w-20 shrink-0 sm:w-28" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{vehicle.make} {vehicle.model}</p>
                <p className="text-sm text-muted-foreground">{vehicle.trim}{vehicle.year ? ` · ${vehicle.year}` : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{vehicle.rangeKm} km {vehicle.rangeStandard}</Badge>
                  <Badge variant="outline">{vehicle.batteryCapacityKwh} kWh</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">AC {vehicle.maxAcKw === null ? "unconfirmed" : `${vehicle.maxAcKw} kW`} · DC {vehicle.maxDcKw === null ? "unconfirmed" : `${vehicle.maxDcKw} kW`}</p>
              </div>
            </label>
          ))}
        </fieldset>}
    </div>
  );
}
