"use client";

import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PlaceSuggestion } from "./data";

type PlaceSearchDropdownProps = {
  activeIndex: number;
  inputId: string;
  listboxId: string;
  suggestions: PlaceSuggestion[];
  onActiveIndexChange: (index: number) => void;
  onSelectSuggestion: (suggestion: PlaceSuggestion) => void;
};

export function PlaceSearchDropdown({
  activeIndex,
  inputId,
  listboxId,
  suggestions,
  onActiveIndexChange,
  onSelectSuggestion,
}: PlaceSearchDropdownProps) {
  return (
    <div
      id={listboxId}
      role="listbox"
      aria-labelledby={inputId}
      className="absolute z-30 mt-2 w-full overflow-hidden rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
    >
      {suggestions.length ? (
        suggestions.map((suggestion, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={suggestion.id}
              id={`${listboxId}-${suggestion.id}`}
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
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{suggestion.label}</span>
            </button>
          );
        })
      ) : (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No matching places.
        </div>
      )}
    </div>
  );
}
