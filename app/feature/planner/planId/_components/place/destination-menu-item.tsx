"use client";

import { Check, MapPin } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import type { TripBlockColorOption } from "../constants/trip-block-colors";
import type { PlaceDestination } from "./place-destinations";

type DestinationMenuItemProps = {
  destination: PlaceDestination;
  /** The list or day colour, so the row's pin matches the pin it will drop on the map. */
  color: TripBlockColorOption;
  onSelect: (blockId: string) => void;
};

/** One list or day in an "add to" menu; a destination that already has the place is checked and disabled. */
export function DestinationMenuItem({ destination, color, onSelect }: DestinationMenuItemProps) {
  return (
    <DropdownMenuItem
      disabled={destination.contains}
      onClick={() => onSelect(destination.blockId)}
      className="min-h-9 gap-2.5 px-2"
    >
      <MapPin aria-hidden="true" className="size-4" style={{ color: color.value, fill: color.value }} />
      <span className="min-w-0 flex-1 truncate">{destination.label}</span>
      {destination.detail ? <span className="shrink-0 text-xs text-muted-foreground">{destination.detail}</span> : null}
      {destination.contains ? <Check aria-label="Already added" className="size-3.5" /> : null}
    </DropdownMenuItem>
  );
}
