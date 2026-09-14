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
  disabled?: boolean;
};

export function VehicleCard({
  vehicle,
  car,
  isActive,
  onSelect,
  onRemove,
  disabled = false,
}: VehicleCardProps) {
  const batteryPct = vehicle.startingBatteryPct;
  const batteryColor =
    batteryPct >= 50
      ? "bg-primary"
      : batteryPct >= 20
        ? "bg-warning"
        : "bg-destructive";

  return (
    <article
      className={cn(
        "relative min-w-0 rounded-md border bg-card p-4 text-left transition-all",
        isActive
          ? "border-primary shadow-sm shadow-primary/20"
          : "border-border hover:border-border/80 hover:bg-card/80",
      )}
    >
      <VehicleMedia car={car} className="mb-3" />

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 basis-24 grow">
          <p className="break-words text-sm font-semibold text-foreground">
            {car.make} {car.model}
          </p>
          {vehicle.nickname && (
            <p className="truncate text-xs text-muted-foreground">
              {vehicle.nickname}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{[car.trim, car.year, car.market === "TH" ? "Thailand" : null].filter(Boolean).join(" · ")}</p>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 px-1.5 py-0 text-[10px] font-medium"
        >
          {vehicle.source === "custom" ? "Custom" : "Catalogue"}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${car.make} ${car.model}`}
          disabled={disabled}
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
        <StatItem label={`${car.rangeStandard ?? "Reference"} range`} value={`${car.rangeKm} km`} />
        <StatItem label="Battery" value={`${car.batteryKwh} kWh`} />
        {car.maxDcKw > 0 && (
          <StatItem label="Max DC" value={`${car.maxDcKw} kW`} />
        )}
        <StatItem label="AC" value={car.maxAcKw > 0 ? `${car.maxAcKw} kW` : car.chargingLimitsKnown === false ? "Unconfirmed" : "Unsupported"} />
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

      {car.sourceUrl && <a href={car.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 block text-xs text-primary underline underline-offset-4">Official specification · checked {car.verifiedAt}</a>}
      {car.sourceUrl && <p className="mt-2 text-xs text-muted-foreground">AI illustration · manufacturer-declared capacity · test range</p>}
      <Button type="button" variant={isActive ? "secondary" : "outline"} className="mt-4 h-auto min-h-10 w-full whitespace-normal px-3 py-2 text-center leading-snug" aria-pressed={isActive} disabled={disabled || isActive} onClick={onSelect}>
        {isActive ? "Selected for route estimates" : "Use this vehicle"}
      </Button>
    </article>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 break-words">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
