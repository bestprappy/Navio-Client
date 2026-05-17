"use client";

import { AlertTriangle, Check, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import type { EvCharger } from "../constants/types";
import type { EvStationVisual } from "./ev-station-panel.data";

type EvStationListCardProps = {
  charger: EvCharger;
  visual: EvStationVisual;
  distanceKm?: number;
  isAdded: boolean;
  isCompatible?: boolean;
  isSelected: boolean;
  onAdd: () => void;
  onSelect: () => void;
};

function formatDistance(distanceKm?: number, maxKw?: number): string {
  if (distanceKm === undefined || distanceKm <= 0) {
    return maxKw != null ? `Up to ${maxKw} kW` : "—";
  }

  return `${distanceKm.toFixed(3)}km`;
}

export function EvStationListCard({
  charger,
  visual,
  distanceKm,
  isAdded,
  isCompatible = true,
  isSelected,
  onAdd,
  onSelect,
}: EvStationListCardProps) {
  const addDisabled = isAdded || !isCompatible;
  const backgroundImage = charger.imageUrl
    ? `url(${charger.imageUrl}), url(${visual.imageUrl})`
    : `url(${visual.imageUrl})`;
  const imageAlt = charger.imageUrl ? `Photo of ${charger.name}` : visual.alt;

  return (
    <article
      className={cn(
        "flex w-full items-center gap-3 rounded-sm bg-background p-2 text-left transition-all",
        isSelected ? "ring-2 ring-primary/20" : "hover:border-primary/40",
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span
          role="img"
          aria-label={imageAlt}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted bg-cover bg-center"
          style={{ backgroundImage }}
        >
          {isAdded ? (
            <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
              <Check className="size-3" aria-hidden="true" />
            </span>
          ) : null}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-foreground">
            {charger.name}
          </span>
          <span className="mt-1 block line-clamp-2 text-[11px] font-medium leading-tight text-muted-foreground">
            {charger.address ?? charger.location.address}
          </span>
          <span className="mt-1 block text-[11px] font-semibold text-primary">
            {formatDistance(distanceKm, charger.maxKw)}
          </span>
          {!isCompatible ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-sm bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
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
