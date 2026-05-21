"use client";

import { AlertTriangle, BatteryCharging, MapPin, Star, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { EvChargerMapResult } from "../overview/trip-builder.atoms";

type ChargerPreviewPanelProps = {
  result: EvChargerMapResult;
  isAdded: boolean;
  isCompatible?: boolean;
  onAddToTrip: () => void;
  onClose: () => void;
};

function getOpeningHoursSummary(openingHours: Record<string, unknown>) {
  const summary = openingHours.summary;
  return typeof summary === "string" ? summary : null;
}

export function ChargerPreviewPanel({
  result,
  isAdded,
  isCompatible = true,
  onAddToTrip,
  onClose,
}: ChargerPreviewPanelProps) {
  const { charger, distanceKm } = result;
  const openingHours = getOpeningHoursSummary(charger.openingHours);
  const availability =
    charger.availableConnectors === null
      ? `${charger.totalConnectors} connectors`
      : `${charger.availableConnectors} of ${charger.totalConnectors} available`;

  return (
    <aside className="absolute bottom-4 left-4 right-4 z-10 rounded-sm border border-border bg-card p-4 text-card-foreground shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            <Zap className="size-3.5" aria-hidden="true" />
            EV station
          </span>
          <span className="rounded-sm bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {distanceKm > 0
              ? `${distanceKm.toFixed(1)} km from trip stop`
              : "Manual selection"}
          </span>
          {charger.stale ? (
            <span className="rounded-sm bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
              Stale
            </span>
          ) : null}
          {!isCompatible ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Connector mismatch
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          aria-label="Close EV station preview"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold leading-tight text-foreground">
              {charger.name}
            </h2>
            {charger.operatorName ? (
              <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {charger.operatorName}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {charger.connectorTypes.join(", ")} - up to {charger.maxKw} kW
          </p>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BatteryCharging
              className="size-4 text-primary"
              aria-hidden="true"
            />
            <span>{availability}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star
              className="size-4 fill-warning text-warning"
              aria-hidden="true"
            />
            <span>
              {charger.ratingAvg.toFixed(1)} ({charger.ratingCount} reviews)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{charger.address ?? charger.location.address}</span>
          </div>
          {openingHours ? (
            <div className="text-foreground">{openingHours}</div>
          ) : null}
          {charger.priceText ? <div>{charger.priceText}</div> : null}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-sm bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {charger.source.replace("_", " ")}
            </span>
            <span className="rounded-sm bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {charger.verificationStatus.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-border/70 pt-3">
        <Button
          type="button"
          size="sm"
          className="rounded-sm"
          onClick={onAddToTrip}
          disabled={isAdded || !isCompatible}
        >
          {!isCompatible ? (
            <>
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Not compatible
            </>
          ) : isAdded ? (
            "Added"
          ) : (
            <>
              <Zap className="size-3.5" aria-hidden="true" />
              Add charging stop
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
