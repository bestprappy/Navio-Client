"use client";

import { Check, Diamond, Navigation } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { EvCharger } from "../constants/types";
import type { EvStationVisual } from "./ev-station-panel.data";

type EvStationListCardProps = {
  charger: EvCharger;
  visual: EvStationVisual;
  distanceKm?: number;
  isAdded: boolean;
  isSelected: boolean;
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
  isSelected,
  onSelect,
}: EvStationListCardProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        "flex w-full bg-background items-center gap-3 rounded-sm p-2 text-left  transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ",
        isSelected ? " ring-2 ring-primary/20" : " hover:border-primary/40  ",
      )}
    >
      <span
        role="img"
        aria-label={visual.alt}
        className="relative h-16 w-16 overflow-hidden rounded-md bg-muted bg-cover bg-center"
        style={{ backgroundImage: `url(${visual.imageUrl})` }}
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
      </span>
    </button>
  );
}
