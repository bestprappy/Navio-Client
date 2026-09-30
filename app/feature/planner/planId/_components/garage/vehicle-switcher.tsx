"use client";

import { cn } from "@/lib/utils";

import { getVehicleCar } from "../constants/vehicle.data";
import type { UserVehicle } from "../constants/vehicle.types";
import { VehicleMedia } from "./vehicle-media";

type VehicleSwitcherProps = {
  vehicles: UserVehicle[];
  activeVehicleId: string | null;
  disabled?: boolean;
  onSelect: (vehicleId: string) => void;
};

/** Compact chips for every saved vehicle; picking one makes it the trip vehicle. */
export function VehicleSwitcher({ vehicles, activeVehicleId, disabled = false, onSelect }: VehicleSwitcherProps) {
  return (
    <div role="group" aria-label="Switch trip vehicle" className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
      {vehicles.map((vehicle) => {
        const car = getVehicleCar(vehicle);
        if (!car) return null;
        const isActive = vehicle.id === activeVehicleId;
        const title = vehicle.nickname?.trim() || car.model;
        return (
          <button
            key={vehicle.id}
            type="button"
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => {
              if (!isActive) onSelect(vehicle.id);
            }}
            className={cn(
              "flex min-w-0 items-center gap-2.5 rounded-lg border p-1.5 pr-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              isActive ? "border-primary bg-primary/10" : "border-border bg-card hover:border-input hover:bg-muted/50",
            )}
          >
            <VehicleMedia car={car} compact className="h-10 w-16 shrink-0 rounded-md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
              <span className={cn("block truncate text-xs", isActive ? "text-primary" : "text-muted-foreground")}>
                {isActive ? "In use" : car.make}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
