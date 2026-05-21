import Image from "next/image";
import { Star } from "lucide-react";

import type { TripBlockColorId } from "../../constants/types";
import { getTripBlockColorById } from "../../constants/trip-block-colors";

export type PlaceCardVisualProps = {
  name: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  description?: string;
  position: number | null;
  colorId: TripBlockColorId;
};

function formatReviewCount(count: number): string {
  return new Intl.NumberFormat("en", {
    notation: count >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}

function isGooglePlacePhoto(url?: string): boolean {
  return Boolean(
    url &&
      (url.includes("googleusercontent.com") ||
        url.includes("places.googleapis.com") ||
        url.includes("maps.googleapis.com")),
  );
}

export function PlaceCardVisual({
  name,
  imageUrl,
  rating,
  reviewCount,
  address,
  description,
  position,
  colorId,
}: PlaceCardVisualProps) {
  const blockColor = getTripBlockColorById(colorId);
  const markerStyle = {
    backgroundColor: blockColor.value,
    color: blockColor.foreground,
  };

  return (
    <>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={640}
          height={240}
          unoptimized={isGooglePlacePhoto(imageUrl)}
          className="h-32 w-full object-cover"
        />
      ) : null}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={markerStyle}
            aria-label={position !== null ? `Place ${position}` : undefined}
          >
            {position}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold leading-snug text-foreground">
                  {name}
                </h3>
                {rating ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    <Star
                      className="size-3 fill-yellow-500 text-yellow-500"
                      aria-hidden="true"
                    />
                    {rating.toFixed(1)}
                    {reviewCount ? (
                      <span className="text-muted-foreground">
                        ({formatReviewCount(reviewCount)})
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
              {description ? (
                <span className="inline-flex items-center rounded-sm bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {description}
                </span>
              ) : null}
            </div>
            {address ? (
              <p className="mt-1 text-xs text-muted-foreground">{address}</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
