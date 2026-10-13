"use client";

import { useState } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { LegTravelMode, PlaceSearchResult } from "../constants/types";
import { addPlaceVisitToBlockAtom, plannerReadOnlyAtom, updatePlaceItemAtom } from "../overview/trip-builder.atoms";
import { fetchPlaceSearch } from "../place/place-api";
import type { RouteCoordinate } from "./trip-route.types";

export function AddTransitStop({ name, coordinate, blockId, beforeItemId, arrivalMode }: {
  name: string; coordinate?: RouteCoordinate; blockId: string; beforeItemId: string; arrivalMode: LegTravelMode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const addVisit = useSetAtom(addPlaceVisitToBlockAtom);
  const updatePlace = useSetAtom(updatePlaceItemAtom);
  const places = useQuery({
    queryKey: ["transit-stop-search", name, coordinate?.[0], coordinate?.[1]],
    queryFn: () => fetchPlaceSearch(name, coordinate ? { lng: coordinate[0], lat: coordinate[1] } : undefined),
    enabled: open && !readOnly,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  if (readOnly) return null;

  function addStation(place: PlaceSearchResult) {
    const itemId = addVisit({ blockId, beforeItemId, place: {
      ...place, placeId: place.id, placeType: place.primaryType,
    } });
    if (!itemId) {
      setError("This journey changed. Open travel options again.");
      return;
    }
    updatePlace({ blockId, itemId, updates: { arrivalMode } });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-xs" data-no-drag aria-label={`Add ${name} to plan`} />}>
        <Plus className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-3">
        <PopoverTitle>Add {name}</PopoverTitle>
        <PopoverDescription>Choose the station to insert before your destination.</PopoverDescription>
        {places.isPending ? <p className="flex items-center gap-2 py-3 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Finding this station…</p> : null}
        {places.isError || (places.data && !places.data.length) ? <p className="py-2 text-muted-foreground">This station could not be found. Try adding it through place search.</p> : null}
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {places.data?.map((place) => (
            <li key={place.id}>
              <button type="button" onClick={() => addStation(place)} className="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0"><span className="block font-medium">{place.name}</span><span className="block text-xs leading-relaxed text-muted-foreground">{place.address}</span></span>
              </button>
            </li>
          ))}
        </ul>
        {error ? <p role="alert" className="text-sm text-warning">{error}</p> : null}
      </PopoverContent>
    </Popover>
  );
}
