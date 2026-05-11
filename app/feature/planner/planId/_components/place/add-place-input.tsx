"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import {
  activeBlockIdAtom,
  closeActiveSearchAtom,
  startPlaceSearchAtom,
} from "../overview/trip-builder.atoms";
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetail,
  fetchPlaceSearch,
} from "./place-api";
import type {
  PlaceAutocompleteSuggestion,
  PlaceSearchResult,
} from "./place-api";
import { PlaceSearchDropdown } from "./place-search-dropdown";

type AddPlaceInputProps = {
  blockId: string;
  searchBias?: PlaceSearchBias;
};

export type PlaceSearchBias = {
  label: string;
  lat: number;
  lng: number;
};

export function AddPlaceInput({ blockId, searchBias }: AddPlaceInputProps) {
  const generatedId = useId();
  const inputId = `place-search-${generatedId}`;
  const listboxId = `place-search-listbox-${generatedId}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sessionToken, setSessionToken] = useState(
    createPlaceSearchSessionToken,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmittingMapSearch, setIsSubmittingMapSearch] = useState(false);
  const [mapSearchError, setMapSearchError] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const closeActiveSearch = useSetAtom(closeActiveSearchAtom);
  const startPlaceSearch = useSetAtom(startPlaceSearchAtom);

  // Debounce the input so the API isn't called on every keystroke
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const autocompleteQuery = useQuery({
    queryKey: [
      "place-autocomplete",
      debouncedQuery,
      sessionToken,
      searchBias?.lat,
      searchBias?.lng,
    ],
    queryFn: () =>
      fetchPlaceAutocomplete(debouncedQuery, {
        lat: searchBias?.lat,
        lng: searchBias?.lng,
        sessionToken,
      }),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
    retry: 1,
  });

  const suggestions = autocompleteQuery.data ?? [];
  const activeSuggestion = suggestions[activeIndex];

  const nearbySearchQuery = useQuery({
    queryKey: [
      "place-search",
      debouncedQuery,
      searchBias?.lat,
      searchBias?.lng,
    ],
    queryFn: () =>
      fetchPlaceSearch(debouncedQuery, {
        lat: searchBias?.lat,
        lng: searchBias?.lng,
      }),
    enabled: debouncedQuery.trim().length >= 2 && isDropdownOpen,
    staleTime: 30_000,
    retry: 1,
  });

  const detailMutation = useMutation({
    mutationFn: (suggestion: PlaceAutocompleteSuggestion) => {
      if (suggestion.place) {
        return Promise.resolve(suggestion.place);
      }

      return fetchPlaceDetail(suggestion.providerPlaceId, suggestion.provider, {
        sessionToken: suggestion.sessionToken,
      });
    },
    onSuccess: (result) => {
      startPlaceSearch({ blockId, result });
      setQuery("");
      setDebouncedQuery("");
      setSessionToken(createPlaceSearchSessionToken());
      setActiveIndex(0);
      setIsDropdownOpen(false);
    },
    onError: (error, suggestion) => {
      console.error("Failed to fetch place detail.", {
        component: "AddPlaceInput",
        operation: "fetchPlaceDetail",
        providerPlaceId: suggestion.providerPlaceId,
        provider: suggestion.provider,
        error,
      });
    },
  });

  useEffect(() => {
    if (!isDropdownOpen || !wrapperRef.current) {
      return;
    }

    function updatePosition() {
      if (!wrapperRef.current) {
        return;
      }

      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isDropdownOpen]);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    detailMutation.reset();
    setMapSearchError(null);
    setQuery(event.target.value);
    setActiveIndex(0);
    setIsDropdownOpen(true);
    setActiveBlockId(blockId);
    closeActiveSearch();
  }

  function selectSuggestion(suggestion: PlaceAutocompleteSuggestion) {
    setActiveBlockId(blockId);
    setIsDropdownOpen(false);
    detailMutation.mutate(suggestion);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void showResultsOnMap();
      return;
    }

    if (!suggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }
  }

  async function showResultsOnMap() {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    setActiveBlockId(blockId);
    setMapSearchError(null);
    setIsSubmittingMapSearch(true);

    try {
      const cachedResults =
        trimmedQuery === debouncedQuery.trim() ? nearbySearchQuery.data : null;
      const results =
        cachedResults ??
        (await fetchPlaceSearch(trimmedQuery, {
          lat: searchBias?.lat,
          lng: searchBias?.lng,
        }));

      if (!results.length) {
        setMapSearchError("No matching places found on the map.");
        return;
      }

      startPlaceSearch({
        blockId,
        query: trimmedQuery,
        results: sortResultsByDistance(results, searchBias),
      });
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Failed to show place search results on map.", {
        component: "AddPlaceInput",
        operation: "showResultsOnMap",
        query: trimmedQuery,
        error,
      });
      setMapSearchError("Could not show results on the map. Try again.");
    } finally {
      setIsSubmittingMapSearch(false);
    }
  }

  const isFetchingDetail = detailMutation.isPending;
  const errorMessage = detailMutation.isError
    ? "Could not load place details. Try again."
    : mapSearchError;
  const isMapSearchLoading =
    isSubmittingMapSearch || nearbySearchQuery.isFetching;
  const isBusy = isFetchingDetail || isMapSearchLoading;

  const showDropdown =
    isDropdownOpen && query.trim() && dropdownStyle && !isFetchingDetail;

  const inputPlaceholder = isFetchingDetail
    ? "Loading place details..."
    : isMapSearchLoading
      ? "Finding nearby places..."
    : searchBias
      ? `Add places near ${searchBias.label}`
      : "Add places";

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsDropdownOpen(false);
        }
      }}
    >
      <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-4 shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        <MapPin
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            isDropdownOpen && activeSuggestion
              ? `${listboxId}-${activeSuggestion.providerPlaceId}`
              : undefined
          }
          aria-expanded={isDropdownOpen && !isFetchingDetail}
          aria-busy={isBusy}
          value={query}
          placeholder={inputPlaceholder}
          disabled={isFetchingDetail}
          onChange={handleQueryChange}
          onFocus={() => {
            setIsDropdownOpen(true);
            setActiveBlockId(blockId);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-wait disabled:opacity-60"
        />
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-1 text-xs text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      {showDropdown &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              zIndex: 9999,
            }}
          >
            <PlaceSearchDropdown
              activeIndex={activeIndex}
              inputId={inputId}
              isMapSearchLoading={isMapSearchLoading}
              listboxId={listboxId}
              mapResultCount={nearbySearchQuery.data?.length ?? 0}
              query={query}
              suggestions={suggestions}
              isLoading={autocompleteQuery.isFetching}
              error={
                autocompleteQuery.isError
                  ? "Search is temporarily unavailable."
                  : null
              }
              onActiveIndexChange={setActiveIndex}
              onShowResultsOnMap={() => void showResultsOnMap()}
              onSelectSuggestion={selectSuggestion}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

function createPlaceSearchSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sortResultsByDistance(
  results: PlaceSearchResult[],
  searchBias?: PlaceSearchBias,
) {
  if (!searchBias) {
    return results;
  }

  return [...results].sort(
    (a, b) =>
      getDistanceKm(searchBias.lat, searchBias.lng, a.lat, a.lng) -
      getDistanceKm(searchBias.lat, searchBias.lng, b.lat, b.lng),
  );
}

function getDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
