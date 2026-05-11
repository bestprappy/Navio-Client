"use client";

import { Loader2, MapPin, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PlaceAutocompleteSuggestion } from "./place-api";

type PlaceSearchDropdownProps = {
  activeIndex: number;
  inputId: string;
  isMapSearchLoading: boolean;
  listboxId: string;
  mapResultCount: number;
  query: string;
  suggestions: PlaceAutocompleteSuggestion[];
  isLoading: boolean;
  error: string | null;
  onActiveIndexChange: (index: number) => void;
  onShowResultsOnMap: () => void;
  onSelectSuggestion: (suggestion: PlaceAutocompleteSuggestion) => void;
};

export function PlaceSearchDropdown({
  activeIndex,
  inputId,
  isMapSearchLoading,
  listboxId,
  mapResultCount,
  query,
  suggestions,
  isLoading,
  error,
  onActiveIndexChange,
  onShowResultsOnMap,
  onSelectSuggestion,
}: PlaceSearchDropdownProps) {
  const trimmedQuery = query.trim();

  return (
    <div
      id={listboxId}
      role="listbox"
      aria-labelledby={inputId}
      className="absolute z-30 mt-2 w-full overflow-hidden rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
    >
      {trimmedQuery ? (
        <button
          type="button"
          role="option"
          aria-selected={false}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onShowResultsOnMap}
          className="mb-1 flex w-full items-start gap-3 rounded-sm px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          {isMapSearchLoading ? (
            <Loader2
              className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <Search
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate">
              <span className="font-semibold">{trimmedQuery}</span>{" "}
              <span className="text-muted-foreground">See locations</span>
            </span>
            <span className="block truncate text-xs text-foreground">
              {isMapSearchLoading
                ? "Finding results..."
                : mapResultCount > 0
                  ? `See ${mapResultCount} result${mapResultCount === 1 ? "" : "s"} on map`
                  : "See result(s) on map"}
            </span>
          </span>
        </button>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Searching places...</span>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="px-3 py-4 text-sm text-destructive"
        >
          {error}
        </div>
      ) : suggestions.length ? (
        suggestions.map((suggestion, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={`${suggestion.provider}:${suggestion.providerPlaceId}`}
              id={`${listboxId}-${suggestion.providerPlaceId}`}
              type="button"
              role="option"
              aria-selected={isActive}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onActiveIndexChange(index)}
              onClick={() => onSelectSuggestion(suggestion)}
              className={cn(
                "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-foreground hover:bg-muted/70",
              )}
            >
              <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {suggestion.mainText}
                </span>
                {suggestion.secondaryText ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {suggestion.secondaryText}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })
      ) : (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No matching places found.
        </div>
      )}
    </div>
  );
}
