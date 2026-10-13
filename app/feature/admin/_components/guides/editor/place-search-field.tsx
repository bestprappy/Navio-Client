"use client";

import { useEffect, useId, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PlaceAutocompleteSuggestion, PlaceSearchResult } from "../../../../planner/planId/_components/constants/types";
import { fetchPlaceAutocomplete, fetchPlaceDetail } from "../../../../planner/planId/_components/place/place-api";
import type { GuideDestination } from "../guide-model";

function createSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type PlaceSearchFieldHandle = { focus: () => void; clear: () => void };

type PlaceSearchFieldProps = {
  /** Suggestions are biased toward the guide's destination. */
  destination: GuideDestination;
  label: string;
  placeholder: string;
  onPick: (place: PlaceSearchResult) => void;
  onFocus?: () => void;
  /** Escape with the suggestions already closed. */
  onEscape?: () => void;
  handleRef?: Ref<PlaceSearchFieldHandle>;
};

/** A place search box: type, pick a suggestion, get the place's full details. */
export function PlaceSearchField({ destination, label, placeholder, onPick, onFocus, onEscape, handleRef }: PlaceSearchFieldProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sessionToken, setSessionToken] = useState(createSessionToken);

  useImperativeHandle(handleRef, () => ({
    focus: () => inputRef.current?.focus({ preventScroll: true }),
    clear: () => {
      setQuery("");
      setDebouncedQuery("");
    },
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const suggestionsQuery = useQuery({
    queryKey: ["guide-place-autocomplete", debouncedQuery, destination.lat, destination.lng, sessionToken],
    queryFn: () => fetchPlaceAutocomplete(debouncedQuery, { lat: destination.lat, lng: destination.lng, sessionToken }),
    enabled: isOpen && debouncedQuery.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
  const suggestions = suggestionsQuery.data ?? [];
  const activeSuggestion = suggestions[activeIndex];

  const detail = useMutation({
    mutationFn: (suggestion: PlaceAutocompleteSuggestion) =>
      suggestion.place ? Promise.resolve(suggestion.place) : fetchPlaceDetail(suggestion.providerPlaceId, suggestion.provider, { sessionToken: suggestion.sessionToken ?? sessionToken }),
    onSuccess: (place) => {
      setIsOpen(false);
      setSessionToken(createSessionToken());
      onPick(place);
    },
    onError: (error, suggestion) => {
      console.error("Could not load the chosen place.", { component: "PlaceSearchField", operation: "fetchPlaceDetail", providerPlaceId: suggestion.providerPlaceId, error });
    },
  });

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (isOpen) setIsOpen(false);
      else onEscape?.();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && activeSuggestion) detail.mutate(activeSuggestion);
      return;
    }
    if (!suggestions.length || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    event.preventDefault();
    setIsOpen(true);
    const step = event.key === "ArrowDown" ? 1 : -1;
    setActiveIndex((current) => (current + step + suggestions.length) % suggestions.length);
  }

  const showListbox = isOpen && query.trim().length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
        }}
      >
        <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          {detail.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={label}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showListbox}
            aria-activedescendant={showListbox && activeSuggestion ? `${listboxId}-${activeIndex}` : undefined}
            aria-busy={suggestionsQuery.isFetching || detail.isPending}
            value={query}
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setIsOpen(true);
              detail.reset();
            }}
            onFocus={() => {
              setIsOpen(true);
              onFocus?.();
            }}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {showListbox ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label={`Places matching ${query.trim()}`}
            className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto overscroll-contain rounded-xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
          >
            {query.trim().length < 2 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">Type at least 2 characters.</p>
            ) : suggestionsQuery.isError ? (
              <p role="alert" className="px-3 py-3 text-sm text-destructive">
                Place search is unavailable right now. Try again in a moment.
              </p>
            ) : suggestionsQuery.isFetching && !suggestions.length ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Searching places…
              </p>
            ) : suggestions.length ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.provider}:${suggestion.providerPlaceId}`}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => detail.mutate(suggestion)}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm", index === activeIndex ? "bg-muted" : "hover:bg-muted/70")}
                >
                  <MapPin aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{suggestion.mainText}</span>
                    {suggestion.secondaryText ? <span className="block truncate text-xs text-muted-foreground">{suggestion.secondaryText}</span> : null}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-muted-foreground">No places match “{query.trim()}”. Try another name.</p>
            )}
          </div>
        ) : null}
      </div>

      {detail.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load that place. Choose it again.
        </p>
      ) : null}
    </div>
  );
}
