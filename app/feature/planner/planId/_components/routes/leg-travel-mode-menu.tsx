"use client";

import { ChevronDown } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { LegTravelMode } from "../constants/types";
import { updatePlaceItemAtom } from "../overview/trip-builder.atoms";
import { isLegTravelMode, LEG_TRAVEL_MODES } from "./leg-travel-mode";
import { LEG_TRAVEL_MODE_META } from "./leg-travel-mode-meta";

type LegTravelModeMenuProps = {
  blockId: string;
  itemId: string;
  /** The mode the leg uses now. */
  mode: LegTravelMode;
  /** The mode the leg would use without a choice; picking it returns the leg to automatic. */
  automaticMode: LegTravelMode;
  routeColor: string;
};

export function LegTravelModeMenu({
  blockId,
  itemId,
  mode,
  automaticMode,
  routeColor,
}: LegTravelModeMenuProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const { label, Icon } = LEG_TRAVEL_MODE_META[mode];

  function selectMode(value: unknown) {
    if (!isLegTravelMode(value)) return;
    // Storing the automatic mode as "automatic" keeps the leg following its stops.
    updatePlaceItem({
      blockId,
      itemId,
      updates: { arrivalMode: value === automaticMode ? null : value },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-no-drag
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="-ml-1.5 gap-1 px-1.5"
            aria-label={`Travel mode: ${label}. Change how this leg is travelled`}
          />
        }
      >
        <Icon className="size-4" style={{ color: routeColor }} aria-hidden="true" />
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Travel this leg by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={mode} onValueChange={selectMode}>
            {LEG_TRAVEL_MODES.map((option) => {
              const meta = LEG_TRAVEL_MODE_META[option];
              return (
                <DropdownMenuRadioItem key={option} value={option}>
                  <meta.Icon aria-hidden="true" />
                  {meta.label}
                  {option === automaticMode ? (
                    <span className="ml-auto text-xs text-muted-foreground">Auto</span>
                  ) : null}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
