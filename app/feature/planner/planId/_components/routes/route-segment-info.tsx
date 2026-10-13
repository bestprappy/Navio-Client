"use client";

import type { ReactNode } from "react";
import { CircleHelp, Loader2 } from "lucide-react";

import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import type { LegTravelMode } from "../constants/types";
import { isTransitMode } from "./leg-travel-mode";
import { LEG_TRAVEL_MODE_META } from "./leg-travel-mode-meta";
import {
  formatRouteDistance,
  formatRouteDuration,
  getSegmentTravelMode,
  safeLineColor,
} from "./trip-route.helpers";
import type { RouteSegment, RouteStep } from "./trip-route.types";
import { getLineTextColor } from "./travel-options";

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
  rail: "No rail route",
  bus: "No bus route",
  bike: "No cycling route",
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
  const missingSelection = segment?.fallbackReason === "Your selected transit route is not available";
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
        {modeIndicator}
        <Popover>
          <PopoverTrigger className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-warning hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Why is this connection a straight line?">
            <CircleHelp className="size-4" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <PopoverTitle>Connection unverified</PopoverTitle>
            <PopoverDescription>The dashed line only connects these places on the map. It is not a confirmed route or a path to follow.</PopoverDescription>
            <p className="text-xs leading-relaxed text-muted-foreground">{isError ? "Route information could not be loaded. Try again or check Google Maps." : missingSelection ? "Your saved line and station sequence could not be confirmed. Open the route choices to retry or select another journey." : isTransitMode(mode) ? "Transit data may be unavailable here or for this service. This does not mean the train or bus does not exist. Compare travel options or check Google Maps." : "Route information is unavailable. Compare travel options or check Google Maps."}</p>
          </PopoverContent>
        </Popover>
        <span className="font-medium text-warning">
          {isError ? "Route unavailable" : missingSelection ? "Selected route unverified" : "Connection unverified"}
        </span>
        <span className="text-muted-foreground">
          {segment?.distanceMeters
            ? `${formatRouteDistance(segment.distanceMeters)} direct distance`
            : missingSelection ? "Choose another route" : mode === "transit" && segment?.fallbackReason === "No rail route was found" ? "Rail route not confirmed" : MISSING_ROUTE_LABEL[mode]}
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
  const foreground = getLineTextColor(background);
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
