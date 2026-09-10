"use client";

import { useEffect, useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchDestinationCoordinates, fetchDestinationSuggestions, type DestinationSuggestion } from "../../../_components/destination-api";
import type { TripDestination } from "../constants/types";

type Props = {
  destination: TripDestination;
  isOverride: boolean;
  isFirstDay: boolean;
  onChange: (destination: TripDestination | null) => Promise<void>;
};

export function DayDestinationPicker({ destination, isOverride, isFirstDay, onChange }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const suggestions = useQuery({
    queryKey: ["day-destination-search", search],
    queryFn: () => fetchDestinationSuggestions(search),
    enabled: open && search.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
  const selection = useMutation({
    mutationFn: async (suggestion: DestinationSuggestion | null) => {
      if (!suggestion) return onChange(null);
      const point = suggestion.coordinates ?? await fetchDestinationCoordinates(suggestion.providerPlaceId, suggestion.provider, suggestion.sessionToken);
      if (!point) throw new Error("We couldn't locate that destination. Please try another result.");
      await onChange({ id: suggestion.providerPlaceId, name: suggestion.mainText, lat: point.lat, lng: point.lng, country: suggestion.secondaryText.split(",").at(-1)?.trim() || undefined });
    },
    onSuccess: () => { setOpen(false); setQuery(""); },
  });
  const items = suggestions.data ?? [];
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-secondary/30 p-3">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => { setOpen(!open); selection.reset(); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">{isFirstDay ? "Trip destination" : isOverride ? "New destination from this day" : "Destination"}</span><span className="block break-words font-semibold">{destination.name}</span></span>
        <span className="text-xs text-primary">Change</span><ChevronDown className="size-4 shrink-0" aria-hidden="true" />
      </button>
      {open && <div id={id} className="mt-3 space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">Applies from this day until your next destination change. Your existing stops stay in place.</p>
        <input autoFocus aria-label="Search for a city or region" role="combobox" aria-expanded={items.length > 0} aria-controls={`${id}-results`} aria-autocomplete="list" aria-activedescendant={items[activeIndex] ? `${id}-option-${activeIndex}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" && items.length) { event.preventDefault(); setActiveIndex((value) => (value + 1) % items.length); }
          if (event.key === "ArrowUp" && items.length) { event.preventDefault(); setActiveIndex((value) => (value + items.length - 1) % items.length); }
          if (event.key === "Enter" && items[activeIndex]) { event.preventDefault(); selection.mutate(items[activeIndex]); }
        }} placeholder="Search for a city or region" disabled={selection.isPending} className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        {suggestions.isFetching && <p role="status" className="flex gap-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching destinations…</p>}
        {suggestions.isError && <p role="alert" className="text-xs text-destructive">Destination search is unavailable. Try again shortly.</p>}
        {search.length >= 2 && !suggestions.isFetching && !suggestions.isError && items.length === 0 && <p className="text-xs text-muted-foreground">No destinations found. Try a city or region name.</p>}
        <div id={`${id}-results`} role="listbox" aria-label="Destinations" className="max-h-64 overflow-y-auto">
          {items.map((item, index) => <button key={`${item.provider}:${item.providerPlaceId}`} id={`${id}-option-${index}`} role="option" aria-selected={index === activeIndex} type="button" disabled={selection.isPending} onClick={() => selection.mutate(item)} className={`flex min-h-11 w-full gap-2 rounded-lg p-2 text-left text-sm hover:bg-muted ${index === activeIndex ? "bg-muted" : ""}`}><MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" /><span><span className="block font-medium">{item.mainText}</span><span className="text-xs text-muted-foreground">{item.secondaryText}</span></span></button>)}
        </div>
        {selection.isError && <p role="alert" className="text-xs text-destructive">{selection.error.message}</p>}
        {selection.isPending && <p role="status" className="text-xs text-muted-foreground">Saving destination…</p>}
        <div className="flex flex-wrap gap-2">
          {isOverride && !isFirstDay && <Button type="button" variant="outline" disabled={selection.isPending} onClick={() => selection.mutate(null)}><Check className="size-4" />Use previous destination</Button>}
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}><X className="size-4" />Close</Button>
        </div>
      </div>}
    </div>
  );
}
