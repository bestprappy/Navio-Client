"use client";

import { useSetAtom } from "jotai";
import { Flag, MapPin } from "lucide-react";
import type { TripAnchor, TripBlockColorId } from "../constants/types";
import { getTripBlockColorById } from "../constants/trip-block-colors";
import { focusedAnchorAtom } from "./anchor-map.atoms";
import { SaveFavoritePlaceButton } from "./save-favorite-place-button";
import { useTripCharging } from "../garage/use-trip-charging";
import { useTripRoutes } from "../routes/trip-route-query";
import { RouteSegmentInfo } from "../routes/route-segment-info";
import { DischargeSegmentInfo } from "../routes/charge-segment-info";

export function EndAnchorRouteInfo({ blockId, routeColor }: { blockId: string; routeColor: string }) {
  const routes = useTripRoutes();
  const charging = useTripCharging();
  const segment = routes.data?.segments.find((entry) => entry.blockId === blockId && entry.toItemId === `${blockId}:end`);
  const states = charging?.days.get(blockId)?.batteryByItemId;
  return <div className="my-3 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
    <div className="flex justify-center py-1" aria-hidden="true"><span className="h-full min-h-8 w-px bg-border" /></div>
    <div className="flex flex-col gap-3">
      <RouteSegmentInfo segment={segment ?? null} isLoading={routes.isFetching && !routes.data} isError={routes.isError} routeColor={routeColor} />
      <DischargeSegmentInfo batteryFrom={segment ? states?.get(segment.fromItemId)?.departurePct : undefined} batteryTo={states?.get(`${blockId}:end`)?.arrivalPct} />
    </div>
  </div>;
}

export function AnchorStopCard({ anchor, edge, position, colorId }: { anchor: TripAnchor | null; edge: "start" | "end"; position?: number; colorId: TripBlockColorId }) {
  const focus = useSetAtom(focusedAnchorAtom);
  if (!anchor) return null;
  const blockColor = getTripBlockColorById(colorId);
  const Icon = edge === "start" ? MapPin : Flag;
  return (
    // Same gutter column as sortable item rows so anchors line up with stops.
    <div className="my-3 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
    <div aria-hidden="true" />
    <div className="min-w-0 rounded-xl border border-primary/30 bg-card p-4">
    <button type="button" onClick={() => focus({ ...anchor })}
      aria-label={`Show ${edge}: ${anchor.name} on map`}
      className="flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
      {position != null ? <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ backgroundColor: blockColor.value, color: blockColor.foreground }} aria-label={`Stop ${position}`}>{position}</span> : <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-primary">{edge === "start" ? "Start" : "End"}</span>
        <span className="block break-words text-sm font-semibold">{anchor.name}</span>
        <span className="block break-words text-xs text-muted-foreground">{anchor.address || `${anchor.lat.toFixed(5)}, ${anchor.lng.toFixed(5)}`}</span>
      </span>
      <span className="text-xs text-primary">Show on map</span>
    </button>
    <div className="mt-3"><SaveFavoritePlaceButton key={`${anchor.id}:${anchor.lat}:${anchor.lng}`} anchor={anchor} /></div>
    </div>
    </div>
  );
}
