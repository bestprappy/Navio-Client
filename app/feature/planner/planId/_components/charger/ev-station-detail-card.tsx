"use client";

import { BatteryCharging, Check, PlugZap, Star, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { EvCharger } from "../constants/types";
import { getPricePerKwh } from "./ev-station-formatters";

type EvStationDetailCardProps = {
  charger: EvCharger;
  distanceKm?: number;
  isAdded: boolean;
  onAdd: () => void;
};

function formatDrivingEstimate(distanceKm?: number): string {
  if (!distanceKm || distanceKm <= 0) {
    return "EV charging station";
  }

  const miles = distanceKm * 0.621371;
  const minutes = Math.max(1, Math.round(miles / 0.6));
  const roundedMiles = miles >= 10 ? Math.round(miles) : miles.toFixed(1);

  return `${minutes} mins driving (${roundedMiles} miles)`;
}

export function EvStationDetailCard({
  charger,
  distanceKm,
  isAdded,
  onAdd,
}: EvStationDetailCardProps) {
  const availableOutlets =
    charger.availableConnectors ?? charger.totalConnectors;

  return (
    <article className="overflow-hidden rounded-sm ">
      <div className="px-4 pb-4 pt-5 flex flex-col">
        <div className="items-center flex justify-between">
          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-foreground">
            {charger.name}
          </h3>
          {charger.ratingAvg > 0 && (
            <div className="flex shrink-0 items-center gap-1 ml-2">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400 " aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">
                {charger.ratingAvg.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({charger.ratingCount})
              </span>
            </div>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-foreground/80">
          {charger.address ?? charger.location.address}
        </p>
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          {formatDrivingEstimate(distanceKm)}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-full bg-muted px-4 py-3 text-xs font-semibold">
          <span className="text-muted-foreground">Recharge Price</span>
          <span className="text-foreground">
            {getPricePerKwh(charger.priceText)} /kWh
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 ">
        <div className="flex min-h-32 flex-col items-center justify-center px-3 py-5 text-center">
          <BatteryCharging className="size-6 text-primary" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold leading-none text-foreground">
            {availableOutlets}
          </p>
          <p className="mt-2 max-w-28 text-xs font-medium leading-tight text-foreground">
            Electrical outlet available
          </p>
        </div>
        <div className="flex min-h-32 flex-col items-center justify-center px-3 py-5 text-center">
          <PlugZap className="size-6 text-primary" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold leading-none text-foreground">
            {charger.maxKw}{" "}
            <span className="text-sm font-semibold text-foreground/80">
              kWh
            </span>
          </p>
          <p className="mt-2 max-w-32 text-xs font-medium leading-tight text-foreground">
            Power of electrical outlet
          </p>
        </div>
      </div>

      <Button
        type="button"
        className="m-4  w-[calc(100%-2rem)] rounded-sm py-5"
        disabled={isAdded}
        onClick={onAdd}
      >
        {isAdded ? (
          <>
            <Check className="size-4" aria-hidden="true" />
            Added to trip
          </>
        ) : (
          <>
            <Zap className="size-4" aria-hidden="true" />
            Add to trip
          </>
        )}
      </Button>
    </article>
  );
}
