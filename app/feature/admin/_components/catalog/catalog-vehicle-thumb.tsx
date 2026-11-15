"use client";

import { useState } from "react";
import Image from "next/image";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

type CatalogVehicleThumbProps = {
  imageUrl: string | null;
  className?: string;
};

/** Small decorative vehicle image for a catalog row; the row carries the name. */
export function CatalogVehicleThumb({ imageUrl, className }: CatalogVehicleThumbProps) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = imageUrl?.trim();
  const local = Boolean(url?.startsWith("/images/vehicles/"));
  const usable = url && (local || url.startsWith("https://")) && failedUrl !== url;
  return (
    <div aria-hidden="true" className={cn(
      "relative flex h-12 w-18 shrink-0 items-center justify-center overflow-hidden rounded-lg",
      "bg-linear-to-br from-primary/18 via-primary/6 to-transparent ring-1 ring-border ring-inset",
      className,
    )}>
      {usable
        ? <Image src={url} alt="" fill sizes="72px" unoptimized={!local} className="object-contain p-1" onError={() => setFailedUrl(url)} />
        : <Car className="size-5 text-primary/70" />}
    </div>
  );
}
