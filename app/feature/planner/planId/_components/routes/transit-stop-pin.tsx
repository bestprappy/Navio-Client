"use client";

import { BusFront, TrainFront } from "lucide-react";
import { useSetAtom } from "jotai";
import { focusedAnchorAtom } from "../itinerary/anchor-map.atoms";
import { safeLineColor } from "./trip-route.helpers";
import type { TransitStopMarker } from "./transit-journey.helpers";

export function TransitStopPin({ stop }: { stop: TransitStopMarker }) {
  const focus = useSetAtom(focusedAnchorAtom);
  const Icon = stop.vehicleType?.includes("BUS") ? BusFront : TrainFront;
  const label = `${stop.role} at ${stop.name}`;
  return <button type="button" aria-label={label} title={label} onClick={(event) => { event.stopPropagation(); focus({ id: stop.id, kind: "PLACE", name: stop.name, lat: stop.coordinate[1], lng: stop.coordinate[0] }); }} className="flex size-7 items-center justify-center rounded-md border-2 bg-card text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ borderColor: safeLineColor(stop.lineColor) ?? "var(--place-tag-rail)" }}><Icon className="size-3.5" aria-hidden="true" /></button>;
}
