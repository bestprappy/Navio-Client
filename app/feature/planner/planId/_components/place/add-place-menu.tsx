"use client";

import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTripBlockColorResolver } from "../constants/use-trip-block-color";
import { createPlaceVisit } from "../itinerary/trip-location-markers";
import { useRevealPlanCard } from "../itinerary/use-reveal-plan-card";
import {
  addMyListBlockAtom,
  addPlaceVisitToBlockAtom,
  plannerReadOnlyAtom,
  tripBlocksAtom,
} from "../overview/trip-builder.atoms";
import { DestinationMenuItem } from "./destination-menu-item";
import { getPlaceDestinations, type PlaceDestination } from "./place-destinations";

type AddPlaceMenuProps = {
  place: Parameters<typeof createPlaceVisit>[0];
};

/**
 * The caret beside a preview's add button: adds the place to any list or day,
 * or to a new list, instead of only the one the search started from.
 */
export function AddPlaceMenu({ place }: AddPlaceMenuProps) {
  const blocks = useAtomValue(tripBlocksAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const addVisit = useSetAtom(addPlaceVisitToBlockAtom);
  const addList = useSetAtom(addMyListBlockAtom);
  const reveal = useRevealPlanCard();
  const resolveColor = useTripBlockColorResolver();
  const { lists, days } = useMemo(() => getPlaceDestinations(blocks, place), [blocks, place]);

  if (readOnly) return null;

  const addTo = (blockId: string) => {
    const itemId = addVisit({ blockId, place });
    if (itemId) reveal(blockId, itemId);
  };

  const renderDestination = (destination: PlaceDestination) => (
    <DestinationMenuItem
      key={destination.blockId}
      destination={destination}
      color={resolveColor(destination.colorId)}
      onSelect={addTo}
    />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            className="rounded-l-none rounded-r-sm border-l border-primary-foreground/25 px-1.5"
            aria-label={`Choose where to add ${place.name}`}
          />
        }
      >
        <ChevronDown aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-64">
        {lists.length > 0 ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>My List</DropdownMenuLabel>
            {lists.map(renderDestination)}
          </DropdownMenuGroup>
        ) : null}
        {days.length > 0 ? (
          <>
            {lists.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Itinerary</DropdownMenuLabel>
              {days.map(renderDestination)}
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-9 gap-2.5 px-2 text-muted-foreground"
          onClick={() => {
            const listId = addList();
            if (listId) addTo(listId);
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          New list
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
