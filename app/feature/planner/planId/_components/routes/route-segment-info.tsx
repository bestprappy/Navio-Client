import { AlertTriangle, Car, Loader2 } from "lucide-react";

import {
  formatRouteDistance,
  formatRouteDuration,
} from "./trip-route.helpers";
import type { RouteSegment } from "./trip-route.types";

type RouteSegmentInfoProps = {
  segment: RouteSegment | null;
  isError: boolean;
  isLoading: boolean;
  routeColor: string;
};

export function RouteSegmentInfo({
  segment,
  isError,
  isLoading,
  routeColor,
}: RouteSegmentInfoProps) {
  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs"
        aria-live="polite"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Calculating route...</span>
      </div>
    );
  }

  if (!segment || isError || segment.status === "fallback") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning shadow-xs">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span>Road route unavailable</span>
        <span aria-hidden="true">/</span>
        <span>
          {segment?.distanceMeters
            ? `${formatRouteDistance(segment.distanceMeters)} direct`
            : "direct dashed line only"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
      <Car
        className="size-4 shrink-0"
        style={{ color: routeColor }}
        aria-hidden="true"
      />
      <span>{formatRouteDuration(segment.durationSeconds)}</span>
      <span aria-hidden="true">/</span>
      <span>{formatRouteDistance(segment.distanceMeters)}</span>
    </div>
  );
}
