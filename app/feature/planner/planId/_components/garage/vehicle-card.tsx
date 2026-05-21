"use client";

import { Trash2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import { VehicleMedia } from "./vehicle-media";

type VehicleCardProps = {
  vehicle: UserVehicle;
  car: EvCar;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
};

export function VehicleCard({
  vehicle,
  car,
  isActive,
  onSelect,
  onRemove,
}: VehicleCardProps) {
  const batteryPct = vehicle.startingBatteryPct;
  const batteryColor =
    batteryPct >= 50
      ? "bg-primary"
      : batteryPct >= 20
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        "relative cursor-pointer rounded-md border bg-card p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isActive
          ? "border-primary shadow-sm shadow-primary/20"
          : "border-border hover:border-border/80 hover:bg-card/80",
      )}
    >
      <VehicleMedia car={car} compact className="mb-3" />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {car.make} {car.model}
          </p>
          {vehicle.nickname && (
            <p className="truncate text-xs text-muted-foreground">
              {vehicle.nickname}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{car.year}</p>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 px-1.5 py-0 text-[10px] font-medium"
        >
          {vehicle.source === "custom" ? "Custom" : "Preset"}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${car.make} ${car.model}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Battery</span>
          <span className="font-medium text-foreground">{batteryPct}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`Battery at ${batteryPct}%`}
          aria-valuenow={batteryPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full transition-all", batteryColor)}
            style={{ width: `${batteryPct}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
        <StatItem label="Range" value={`${car.rangeKm} km`} />
        <StatItem label="Battery" value={`${car.batteryKwh} kWh`} />
        {car.maxDcKw > 0 && (
          <StatItem label="Max DC" value={`${car.maxDcKw} kW`} />
        )}
        <StatItem label="AC" value={`${car.maxAcKw} kW`} />
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1"
        aria-label="Supported connectors"
      >
        {car.connectorTypes.map((ct) => (
          <Badge
            key={ct}
            variant="outline"
            className="gap-1 px-1.5 py-0.5 text-[10px] font-medium"
          >
            <Zap className="size-2.5" aria-hidden="true" />
            {ct}
          </Badge>
        ))}
      </div>

      {isActive && (
        <span
          className="absolute right-2 top-2 size-2 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
