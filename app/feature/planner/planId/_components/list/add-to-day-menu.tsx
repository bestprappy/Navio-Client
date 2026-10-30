"use client";

import { CalendarPlus, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useTripBlockColorResolver } from "../constants/use-trip-block-color";
import { DestinationMenuItem } from "../place/destination-menu-item";
import type { PlaceDestination } from "../place/place-destinations";

type AddToDayMenuProps = {
  days: PlaceDestination[];
  onSelect: (dayId: string) => void;
  /** Visible text, such as "Add to day" or "Add 3 to day". */
  label: string;
  /** Names what is being added, such as "Add Wat Pho to a day". */
  ariaLabel: string;
  variant?: "default" | "outline";
  disabled?: boolean;
  /** Hides the text on narrow planners so a row keeps room for the place name. */
  compactLabel?: boolean;
};

/** The add button with a date menu, for adding saved places to an itinerary day. */
export function AddToDayMenu({
  days, onSelect, label, ariaLabel, variant = "default", disabled = false, compactLabel = false,
}: AddToDayMenuProps) {
  const resolveColor = useTripBlockColorResolver();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button type="button" size="sm" variant={variant} className="shrink-0 gap-1.5" aria-label={ariaLabel} />}
      >
        <CalendarPlus aria-hidden="true" className="size-4" />
        <span className={cn(compactLabel && "hidden @sm/planner:inline")}>{label}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Add to</DropdownMenuLabel>
          {days.length === 0 ? (
            <DropdownMenuItem disabled className="min-h-9 px-2">Add a day to your itinerary first</DropdownMenuItem>
          ) : days.map((day) => (
            <DestinationMenuItem key={day.blockId} destination={day} color={resolveColor(day.colorId)} onSelect={onSelect} />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
