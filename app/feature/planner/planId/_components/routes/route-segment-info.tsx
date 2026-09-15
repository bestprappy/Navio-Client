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
  /** The day's block color, so the icon matches this leg's line on the map. */
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
      <div className="flex h-6 items-center gap-2 text-sm leading-none text-muted-foreground" aria-live="polite">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Finding the road route…
      </div>
    );
  }

  if (!segment || isError || segment.status === "fallback") {
    return (
      <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-none">
        <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
        <span className="font-medium text-warning">No road route</span>
        <span className="text-muted-foreground">
          {segment?.distanceMeters
            ? `${formatRouteDistance(segment.distanceMeters)} in a straight line`
            : "showing a straight line"}
        </span>
      </div>
    );
  }

  return (
    // A layout row avoids the accordion's prose paragraph margins.
    <div className="flex h-6 items-center gap-2 text-sm leading-none">
      <Car className="size-4 shrink-0" style={{ color: routeColor }} aria-hidden="true" />
      <span className="sr-only">Drive </span>
      <span className="font-mono font-medium tabular-nums text-foreground">
        {formatRouteDuration(segment.durationSeconds)}
      </span>
      <span className="font-mono tabular-nums text-muted-foreground">
        {formatRouteDistance(segment.distanceMeters)}
      </span>
    </div>
  );
}
