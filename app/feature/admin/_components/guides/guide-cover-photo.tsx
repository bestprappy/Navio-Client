"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { usePlaceDetails } from "../../../planner/planId/_components/place/use-place-details";

type GuideCoverPhotoProps = {
  /** `PROVIDER:id` of the place whose live photo covers the guide. */
  placeId: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/** The cover's live Google photo; a skeleton while it loads, a quiet tile when there is none. */
export function GuideCoverPhoto({ placeId, sizes, className, priority = false }: GuideCoverPhotoProps) {
  const cover = usePlaceDetails(placeId);
  const imageUrl = cover.data?.imageUrl;

  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image src={imageUrl} alt="" fill sizes={sizes} priority={priority} unoptimized className="object-cover" />
      </div>
    );
  }
  if (cover.isLoading) return <Skeleton className={cn("rounded-none", className)} />;
  return (
    <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
      <ImageOff aria-hidden="true" className="size-6" />
    </div>
  );
}
