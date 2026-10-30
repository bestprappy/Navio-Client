"use client";

import { useState } from "react";
import { MapPin, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getTripBlockColorById } from "../constants/trip-block-colors";
import type { TripLocationVisit } from "./trip-location-markers";

function visitLabel(visit: TripLocationVisit): string {
  const role = visit.edge === "start" || visit.dayRole === "start" ? "Start" : visit.edge === "end" || visit.dayRole === "end" ? "End" : visit.isEvCharger ? "EV station" : `Stop ${visit.number}`;
  return `${visit.blockLabel} · ${role}${visit.time ? ` · ${visit.time}` : ""}`;
}

export function TripLocationPin({ visits, selectedItemId, dimmed = false, onSelect }: {
  visits: readonly TripLocationVisit[];
  selectedItemId?: string;
  /** Faded while another leg is focused; it stays clickable and returns to full strength on hover or focus. */
  dimmed?: boolean;
  onSelect: (visit: TripLocationVisit) => void;
}) {
  const [open, setOpen] = useState(false);
  const primary = visits[0];
  if (!primary) return null;
  const color = getTripBlockColorById(primary.colorId);
  const selected = Boolean(selectedItemId && visits.some((visit) => visit.itemId === selectedItemId));
  const multiple = visits.length > 1;
  const accessibleName = multiple
    ? `${primary.name}: ${visits.length} visits. Choose a visit`
    : `Select ${visitLabel(primary)}: ${primary.name}`;
  const triggerClassName = cn(
    "relative block cursor-pointer rounded-full transition-opacity motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    dimmed && !selected && "opacity-40 hover:opacity-100 focus-visible:opacity-100",
  );
  const pin = <>
    <MapPin
      className={cn("transition-all motion-reduce:transition-none [&>circle]:hidden", selected ? "size-12 drop-shadow-lg" : "size-8 drop-shadow-md")}
      style={{ color: primary.edge === "stop" ? color.value : "var(--map-pin)", fill: primary.edge === "stop" ? color.value : "var(--map-pin)", filter: "var(--map-marker-shadow)" }}
      aria-hidden="true"
    />
    <span className={cn("pointer-events-none absolute left-1/2 top-[41.67%] -translate-x-1/2 -translate-y-1/2 font-bold leading-none", selected ? "text-sm" : "text-[10px]")}
      style={{ color: primary.edge === "stop" ? color.foreground : color.mapColor }}>
      {primary.isEvCharger ? <Zap className={selected ? "size-5" : "size-3"} fill="currentColor" aria-hidden="true" /> : primary.number}
    </span>
    {multiple ? <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-map-pin px-1 text-[9px] font-bold leading-none text-map-pin-foreground shadow-sm ring-1 ring-map-pin-foreground">+{visits.length - 1}</span> : null}
  </>;

  if (!multiple) return <button type="button" aria-label={accessibleName}
    className={triggerClassName}
    onClick={(event) => { event.stopPropagation(); onSelect(primary); }}>{pin}</button>;

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger aria-label={accessibleName} className={cn(triggerClassName, open && "opacity-100")}
      onClick={(event) => event.stopPropagation()}>{pin}</PopoverTrigger>
    <PopoverContent side="top" className="w-64 max-w-[calc(100vw-2rem)] gap-1 p-2">
      <PopoverTitle className="px-2 pt-1">{primary.name}</PopoverTitle>
      <PopoverDescription className="px-2 pb-1 text-xs">Choose a visit to view in your itinerary</PopoverDescription>
      <ul className="max-h-64 overflow-y-auto overscroll-contain">
        {visits.map((visit) => {
          const visitColor = getTripBlockColorById(visit.colorId);
          const isSelected = Boolean(selectedItemId && visit.itemId === selectedItemId);
          return <li key={visit.key}>
            <button type="button" aria-current={isSelected ? "true" : undefined}
              className={cn("flex min-h-11 w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isSelected && "bg-muted")}
              onClick={(event) => { event.stopPropagation(); setOpen(false); onSelect(visit); }}>
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: visitColor.value, color: visitColor.foreground }}>
                {visit.isEvCharger ? <Zap className="size-3.5" /> : visit.number}
              </span>
              <span className="min-w-0"><span className="block text-xs text-muted-foreground">{visitLabel(visit)}</span><span className="block break-words text-sm font-medium">{visit.name}</span></span>
            </button>
          </li>;
        })}
      </ul>
    </PopoverContent>
  </Popover>;
}
