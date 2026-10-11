import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import type { LegTravelMode } from "../constants/types";
import { LEG_TRAVEL_MODE_META } from "./leg-travel-mode-meta";
import {
  formatRouteDistance,
  formatRouteDuration,
  getSegmentTravelMode,
  safeLineColor,
} from "./trip-route.helpers";
import type { RouteSegment, RouteStep } from "./trip-route.types";

type RouteSegmentInfoProps = {
  segment: RouteSegment | null;
  isError: boolean;
  isLoading: boolean;
  /** The day's block color, so the icon matches this leg's line on the map. */
  routeColor: string;
  /** The mode this leg is planned with, known before the route loads. */
  plannedMode?: LegTravelMode;
  /** Replaces the static mode icon, e.g. with a control to change the mode. */
  modeControl?: ReactNode;
};

const MISSING_ROUTE_LABEL: Record<LegTravelMode, string> = {
  drive: "No road route",
  transit: "No transit route",
  walk: "No walking route",
};

export function RouteSegmentInfo({
  segment,
  isError,
  isLoading,
  routeColor,
  plannedMode,
  modeControl,
}: RouteSegmentInfoProps) {
  const mode = plannedMode ?? (segment ? getSegmentTravelMode(segment) : "drive");
  const { label, Icon } = LEG_TRAVEL_MODE_META[mode];
  const modeIndicator = modeControl ?? (
    <>
      <Icon className="size-4 shrink-0" style={{ color: routeColor }} aria-hidden="true" />
      <span className="sr-only">{label} </span>
    </>
  );

  if (isLoading) {
    return (
      <div className="flex h-6 items-center gap-2 text-sm leading-none text-muted-foreground" aria-live="polite">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Finding the route…
      </div>
    );
  }

  if (!segment || isError || segment.status === "fallback") {
    return (
      // The mode control stays reachable so the traveller can switch to a mode that routes.
      <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-none">
        {modeControl}
        <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
        <span className="font-medium text-warning">{MISSING_ROUTE_LABEL[mode]}</span>
        <span className="text-muted-foreground">
          {segment?.distanceMeters
            ? `${formatRouteDistance(segment.distanceMeters)} in a straight line`
            : "showing a straight line"}
        </span>
      </div>
    );
  }

  const rides = (segment.steps ?? []).filter((step) => step.travelMode === "transit");

  return (
    // A layout row avoids the accordion's prose paragraph margins.
    <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-none">
      {modeIndicator}
      <span className="font-mono font-medium tabular-nums text-foreground">
        {formatRouteDuration(segment.durationSeconds)}
      </span>
      <span className="font-mono tabular-nums text-muted-foreground">
        {formatRouteDistance(segment.distanceMeters)}
      </span>
      {rides.length > 0 ? (
        <ol className="flex flex-wrap items-center gap-1" aria-label="Transit lines">
          {rides.map((ride, index) => (
            <li key={`${index}-${ride.line?.name ?? "line"}`}>
              <TransitLineChip ride={ride} fallbackColor={routeColor} />
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function TransitLineChip({ ride, fallbackColor }: { ride: RouteStep; fallbackColor: string }) {
  const line = ride.line;
  const name = line?.name ?? line?.shortName ?? "Transit";
  const background = safeLineColor(line?.color) ?? fallbackColor;
  const foreground = safeLineColor(line?.textColor) ?? "var(--primary-foreground)";
  const stops = ride.stopCount ? `, ${ride.stopCount} ${ride.stopCount === 1 ? "stop" : "stops"}` : "";
  const route = ride.departureStop && ride.arrivalStop ? ` from ${ride.departureStop} to ${ride.arrivalStop}` : "";

  return (
    <span
      className="inline-flex h-5 max-w-40 items-center truncate rounded-sm px-1.5 text-xs font-semibold leading-none shadow-xs"
      style={{ backgroundColor: background, color: foreground }}
      title={`${name}${route}${stops}`}
    >
      <span aria-hidden="true">{line?.shortName ?? name}</span>
      <span className="sr-only">{`${name}${route}${stops}`}</span>
    </span>
  );
}
