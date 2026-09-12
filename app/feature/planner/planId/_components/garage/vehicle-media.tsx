"use client";

import { useState } from "react";
import Image from "next/image";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvCar } from "../constants/vehicle.types";

export function VehicleMedia({ car, className, compact }: { car: EvCar; className?: string; compact?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = car.imageUrl?.trim();
  const displayName = `${car.make} ${car.model}`;
  const safeUrl = url && (url.startsWith("/images/vehicles/") || url.startsWith("https://"));
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted", compact ? "h-24" : "h-44", className)}>
      {safeUrl && failedUrl !== url ? <Image src={url} alt={`${displayName}${url.startsWith("/images/vehicles/") ? " — illustrative image" : ""}`} fill
        sizes={compact ? "(max-width: 640px) 100vw, 320px" : "(max-width: 768px) 100vw, 480px"}
        unoptimized={!url.startsWith("/images/vehicles/")} className="object-contain" onError={() => setFailedUrl(url)} />
        : <div role="img" aria-label={`${displayName} — image unavailable`} className="flex h-full items-center justify-center text-muted-foreground"><Car className="size-10" aria-hidden="true" /></div>}
    </div>
  );
}
