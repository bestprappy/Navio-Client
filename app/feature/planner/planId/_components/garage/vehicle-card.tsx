"use client";

import type { ReactNode } from "react";
import { BatteryFull, ExternalLink, Plug, Route, Trash2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { EvCar, UserVehicle } from "../constants/vehicle.types";
import { ConnectorChips } from "../charger/connector-chips";
import { formatCheckedDate } from "./garage-formatters";
import { estimateRealWorldRange, rangeForConsumption } from "./vehicle-mappers";
import { SpecTile } from "./spec-tile";
import { VehicleMedia } from "./vehicle-media";
import { VehicleNameEditor } from "./vehicle-name-editor";

type VehicleCardProps = {
  vehicle: UserVehicle;
  car: EvCar;
  onRemove: () => void;
  onRename: (nickname: string) => void;
  disabled?: boolean;
  /** Trip settings for this vehicle, shown under the specs. */
  children?: ReactNode;
};

/** The vehicle used for this trip: photo, specs and its trip settings in one card. */
export function VehicleCard({ vehicle, car, onRemove, onRename, disabled = false, children }: VehicleCardProps) {
  const carName = `${car.make} ${car.model}`;
  const nickname = vehicle.nickname?.trim();
  const titleId = `vehicle-${vehicle.id}-title`;
  const meta = [
    car.trim,
    car.year,
    car.market === "TH" ? "Thailand" : null,
    vehicle.source === "custom" ? "Custom specs" : null,
  ].filter(Boolean);
  const checkedOn = formatCheckedDate(car.verifiedAt);

  return (
    <article aria-labelledby={titleId} className="@container/vehicle min-w-0 rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-col gap-4 p-4 @min-[34rem]/vehicle:flex-row @min-[34rem]/vehicle:items-center">
        <VehicleMedia car={car} className="h-40 shrink-0 @min-[34rem]/vehicle:h-36 @min-[34rem]/vehicle:w-2/5" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">Used for this trip</p>
              <VehicleNameEditor
                titleId={titleId}
                carName={carName}
                nickname={nickname}
                disabled={disabled}
                onRename={onRename}
              />
              {meta.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{meta.join(", ")}</p>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mt-1 -mr-2 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Remove ${nickname || carName} from garage`}
              disabled={disabled}
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2">
            <SpecTile icon={Route} tone="primary" {...rangeTile(car)} />
            <SpecTile icon={BatteryFull} tone="charging" label="Battery" value={String(car.batteryKwh)} unit="kWh" />
            <SpecTile icon={Zap} tone="warning" label="DC max" {...chargeLimit(car.maxDcKw, car.chargingLimitsKnown)} />
            <SpecTile icon={Plug} tone="premade" label="AC max" {...chargeLimit(car.maxAcKw, car.chargingLimitsKnown)} />
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Plugs</span>
            {car.connectorTypes.length > 0 ? (
              <ConnectorChips connectors={car.connectorTypes} />
            ) : (
              <span className="text-foreground">Not specified</span>
            )}
          </div>
        </div>
      </div>

      {car.sourceUrl && (
        <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">
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

      {children ? <div className="border-t border-border p-4">{children}</div> : null}
    </article>
  );
}

/** Leads with the range used for planning (battery ÷ consumption); the official test figure is the secondary line. */
function rangeTile(car: EvCar): { label: string; value: string; unit: string; detail?: string } {
  const official = `${car.rangeStandard && car.rangeStandard !== "User supplied" ? car.rangeStandard : "Declared"} ${car.rangeKm} km`;
  if (car.consumptionKwhPer100km > 0) {
    return { label: "Real range", value: String(rangeForConsumption(car.batteryKwh, car.consumptionKwhPer100km)), unit: "km", detail: official };
  }
  const estimate = estimateRealWorldRange(car.rangeKm, car.rangeStandard);
  return estimate
    ? { label: "Real range", value: `~${estimate.km}`, unit: "km", detail: official }
    : { label: "Range", value: String(car.rangeKm), unit: "km" };
}

function chargeLimit(kw: number, limitsKnown?: boolean): { value: string; unit?: string } {
  if (kw > 0) return { value: String(kw), unit: "kW" };
  return { value: limitsKnown === false ? "Unconfirmed" : "None" };
}
