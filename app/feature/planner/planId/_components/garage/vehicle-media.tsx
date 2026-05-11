"use client";

import { cn } from "@/lib/utils";

import { EV_PLACEHOLDER_IMAGE_URL } from "../constants/vehicle.data";
import type { EvCar } from "../constants/vehicle.types";

type VehicleMediaProps = {
  car: EvCar;
  className?: string;
  compact?: boolean;
};

export function VehicleMedia({ car, className, compact }: VehicleMediaProps) {
  const displayName = `${car.make} ${car.model}`;
  const imageUrl = car.imageUrl?.trim() || EV_PLACEHOLDER_IMAGE_URL;

  return (
    <div
      role="img"
      aria-label={displayName}
      className={cn(
        "relative isolate overflow-hidden rounded-md border border-border/60 bg-card",
        compact ? "h-20" : "h-44",
        className,
      )}
    >
      <span
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    </div>
  );
}
