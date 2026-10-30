"use client";

import { useEffect, useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";

import { fetchDestinationCoordinates, fetchDestinationSuggestions, type DestinationSuggestion } from "../../../_components/destination-api";
import type { TripDestination } from "../constants/types";

type DestinationSearchProps = {
  onSelect: (destination: TripDestination) => Promise<void> | void;
  onEscape: () => void;
  /** Disables the field while the caller is saving something else. */
  disabled?: boolean;
};

/** A city or region search box. Resolves the chosen result to coordinates before handing it over. */
export function DestinationSearch({ onSelect, onEscape, disabled = false }: DestinationSearchProps) {
  const id = useId();
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
    enabled: search.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
  const selection = useMutation({
    mutationFn: async (suggestion: DestinationSuggestion) => {
      const point = suggestion.coordinates ?? await fetchDestinationCoordinates(suggestion.providerPlaceId, suggestion.provider, suggestion.sessionToken);
      if (!point) throw new Error("We couldn't locate that destination. Please try another result.");
      await onSelect({ id: suggestion.providerPlaceId, name: suggestion.mainText, lat: point.lat, lng: point.lng, country: suggestion.secondaryText.split(",").at(-1)?.trim() || undefined });
    },
    onSuccess: () => setQuery(""),
    onError: (error, suggestion) => console.error("Could not choose a destination.", { component: "DestinationSearch", operation: "selectDestination", providerPlaceId: suggestion.providerPlaceId, error }),
  });
  const items = suggestions.data ?? [];
  const busy = disabled || selection.isPending;

  return (
    <div className="space-y-3">
      <input autoFocus aria-label="Search for a city or region" role="combobox" aria-expanded={items.length > 0} aria-controls={`${id}-results`} aria-autocomplete="list" aria-activedescendant={items[activeIndex] ? `${id}-option-${activeIndex}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); onEscape(); }
        if (event.key === "ArrowDown" && items.length) { event.preventDefault(); setActiveIndex((value) => (value + 1) % items.length); }
        if (event.key === "ArrowUp" && items.length) { event.preventDefault(); setActiveIndex((value) => (value + items.length - 1) % items.length); }
        if (event.key === "Enter" && items[activeIndex]) { event.preventDefault(); selection.mutate(items[activeIndex]); }
      }} placeholder="Search for a city or region" disabled={busy} className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      {suggestions.isFetching && <p role="status" className="flex gap-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Searching destinations…</p>}
      {suggestions.isError && <p role="alert" className="text-xs text-destructive">Destination search is unavailable. Try again shortly.</p>}
      {search.length >= 2 && !suggestions.isFetching && !suggestions.isError && items.length === 0 && <p className="text-xs text-muted-foreground">No destinations found. Try a city or region name.</p>}
      <div id={`${id}-results`} role="listbox" aria-label="Destinations" className="max-h-64 overflow-y-auto">
        {items.map((item, index) => <button key={`${item.provider}:${item.providerPlaceId}`} id={`${id}-option-${index}`} role="option" aria-selected={index === activeIndex} type="button" disabled={busy} onClick={() => selection.mutate(item)} className={`flex min-h-11 w-full gap-2 rounded-lg p-2 text-left text-sm hover:bg-muted ${index === activeIndex ? "bg-muted" : ""}`}><MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" /><span><span className="block font-medium">{item.mainText}</span><span className="text-xs text-muted-foreground">{item.secondaryText}</span></span></button>)}
      </div>
      {selection.isError && <p role="alert" className="text-xs text-destructive">{selection.error.message}</p>}
      {selection.isPending && <p role="status" className="text-xs text-muted-foreground">Saving destination…</p>}
    </div>
  );
}
