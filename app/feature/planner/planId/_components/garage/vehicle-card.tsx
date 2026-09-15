"use client";

import { CircleCheck, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import { formatCheckedDate, formatConnector } from "./garage-formatters";
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
  const carName = `${car.make} ${car.model}`;
  const nickname = vehicle.nickname?.trim();
  const titleId = `vehicle-${vehicle.id}-title`;
  const meta = [
    nickname ? carName : null,
    car.trim,
    car.year,
    car.market === "TH" ? "Thailand" : null,
    vehicle.source === "custom" ? "Custom specs" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const checkedOn = formatCheckedDate(car.verifiedAt);
  const connectors = car.connectorTypes.map(formatConnector).join(" · ");

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "@container/vehicle flex min-w-0 flex-col rounded-lg border bg-card p-3 transition-colors",
        isActive ? "border-primary ring-1 ring-primary" : "border-border hover:border-input",
      )}
    >
      <VehicleMedia car={car} className="h-36" />

      <div className="mt-3 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 id={titleId} className="wrap-break-word text-base font-semibold leading-snug text-foreground">
            {nickname || carName}
          </h3>
          {meta && <p className="mt-0.5 text-sm text-muted-foreground">{meta}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remove ${nickname || carName} from garage`}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border @min-[22rem]/vehicle:grid-cols-4">
        <Spec label={car.rangeStandard ? `Range · ${car.rangeStandard}` : "Range"} value={String(car.rangeKm)} unit="km" />
        <Spec label="Battery" value={String(car.batteryKwh)} unit="kWh" />
        <Spec label="DC max" {...chargeLimit(car.maxDcKw, car.chargingLimitsKnown)} />
        <Spec label="AC max" {...chargeLimit(car.maxAcKw, car.chargingLimitsKnown)} />
      </dl>

      <p className="mt-3 flex flex-wrap gap-x-2 px-1 text-sm">
        <span className="text-muted-foreground">Plugs</span>
        <span className="font-medium text-foreground">{connectors || "Not specified"}</span>
      </p>

      {car.sourceUrl && (
        <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
          <a
            href={car.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline decoration-input underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Manufacturer specs
            <ExternalLink className="size-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          {checkedOn ? `, checked ${checkedOn}` : ""}. Declared capacity
          {car.rangeStandard ? `, ${car.rangeStandard} test range` : ""}; AI-generated image.
        </p>
      )}

      <div className="mt-auto px-1 pt-3">
        {isActive ? (
          <p className="flex min-h-9 items-center gap-2 text-sm font-medium text-foreground">
            <CircleCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Used for this trip&apos;s battery estimates
          </p>
        ) : (
          <Button type="button" variant="outline" className="h-9 w-full" disabled={disabled} onClick={onSelect}>
            Use for this trip
          </Button>
        )}
      </div>
    </article>
  );
}

function chargeLimit(kw: number, limitsKnown?: boolean): { value: string; unit?: string } {
  if (kw > 0) return { value: String(kw), unit: "kW" };
  return { value: limitsKnown === false ? "Unconfirmed" : "None" };
}

function Spec({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0 bg-card px-3 py-2">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
        {unit && <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">{unit}</span>}
      </dd>
    </div>
  );
}
