"use client";

import { AlertTriangle, Check, Navigation, PlugZap, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import type { EvCharger } from "../constants/types";
import { ConnectorChips } from "./connector-chips";
import { getAvailabilityLabel } from "./ev-station-formatters";

type EvStationListCardProps = {
  charger: EvCharger;
  distanceKm?: number;
  isAdded: boolean;
  isCompatible?: boolean;
  isSelected: boolean;
  onAdd: () => void;
  onSelect: () => void;
};

const MAX_CONNECTOR_CHIPS = 3;

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.max(10, Math.round(distanceKm * 100) * 10)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

/** Faster chargers get a stronger tile; the kW figure itself always carries the meaning. */
function getPowerTone(maxKw: number): string {
  if (maxKw >= 100) return "bg-primary text-primary-foreground";
  if (maxKw >= 40) return "bg-primary/15 text-primary";
  return "bg-muted text-foreground";
}

function PowerTile({ maxKw }: { maxKw: number }) {
  const hasPower = maxKw > 0;
  return (
    <span
      className={cn(
        "flex size-14 shrink-0 flex-col items-center justify-center rounded-md leading-none",
        hasPower ? getPowerTone(maxKw) : "bg-muted text-muted-foreground",
      )}
    >
      <span className="text-lg font-bold tabular-nums">{hasPower ? Math.round(maxKw) : "–"}</span>
      <span className="mt-1 text-xs font-medium opacity-80">kW</span>
      <span className="sr-only">{hasPower ? "maximum power" : "power not listed"}</span>
    </span>
  );
}

export function EvStationListCard({
  charger,
  distanceKm,
  isAdded,
  isCompatible = true,
  isSelected,
  onAdd,
  onSelect,
}: EvStationListCardProps) {
  const addDisabled = isAdded || !isCompatible;
  const address = charger.address ?? charger.location.address;

  return (
    <article
      className={cn(
        "flex w-full items-center gap-3 rounded-sm border bg-background p-3 text-left transition-colors",
        isSelected ? "border-primary/50 bg-card" : "border-transparent hover:border-border",
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <PowerTile maxKw={charger.maxKw} />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{charger.name}</span>
          <ConnectorChips connectors={charger.connectorTypes} max={MAX_CONNECTOR_CHIPS} className="mt-1.5" />
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {distanceKm !== undefined && distanceKm > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Navigation className="size-3 text-primary" aria-hidden="true" />
                <span className="font-medium tabular-nums text-foreground">{formatDistance(distanceKm)}</span>
                from stop
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <PlugZap className="size-3 text-rating" aria-hidden="true" />
              {getAvailabilityLabel(charger)}
            </span>
          </span>
          {address ? (
            <span className="mt-1 block truncate text-xs text-muted-foreground" title={address}>
              {address}
            </span>
          ) : null}
          {!isCompatible ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-sm bg-warning/10 px-1.5 py-0.5 text-xs font-semibold text-warning">
              <AlertTriangle className="size-3" aria-hidden="true" />
              Connector mismatch
            </span>
          ) : null}
        </span>
      </button>

      <button
        type="button"
        disabled={addDisabled}
        onClick={onAdd}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-sm bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        aria-label={
          !isCompatible
            ? `${charger.name} is not compatible`
            : isAdded
              ? `${charger.name} added`
              : `Add ${charger.name}`
        }
      >
        {!isCompatible ? (
          <AlertTriangle className="size-3.5" aria-hidden="true" />
        ) : isAdded ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Zap className="size-3.5" aria-hidden="true" />
        )}
        <span>{!isCompatible ? "No match" : isAdded ? "Added" : "Add"}</span>
      </button>
    </article>
  );
}
