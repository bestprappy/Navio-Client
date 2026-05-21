"use client";

import {
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, MapPin } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { cn } from "@/lib/utils";

import {
  fetchDestinationCoordinates,
  fetchDestinationSuggestions,
  type DestinationSuggestion,
} from "./destination-api";
import {
  destinationActiveIndexAtom,
  destinationQueryAtom,
  destinationSearchOpenAtom,
  destinationValidationErrorAtom,
  isSelectingDestinationAtom,
  selectedDestinationAtom,
} from "./planner-setup.atoms";
import {
  destinationTypeLabels,
  destinationTypes,
  inferDestinationType,
  type Destination,
  type DestinationType,
} from "./data";

// --- Session token ---

function generateSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Debounce hook ---

function useDebounced(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// --- Context ---

type DestinationSearchContextValue = {
  activeIndex: number;
  error: string | null;
  inputId: string;
  isEmpty: boolean;
  isOpen: boolean;
  isSearching: boolean;
  isSelecting: boolean;
  listboxId: string;
  query: string;
  selectedDestination: Destination | null;
  suggestions: DestinationSuggestion[];
  getOptionId: (suggestionId: string) => string;
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleSuggestionSelect: (suggestion: DestinationSuggestion) => void;
  setActiveIndex: (index: number) => void;
  setIsOpen: (isOpen: boolean) => void;
  setQuery: (query: string) => void;
};

const DestinationSearchContext =
  createContext<DestinationSearchContextValue | null>(null);

function useDestinationSearchContext() {
  const context = useContext(DestinationSearchContext);

  if (!context) {
    throw new Error(
      "DestinationSearch compound components must be rendered inside DestinationSearch.Root.",
    );
  }

  return context;
}

// --- Root ---

type DestinationSearchRootProps = {
  children: ReactNode;
  inputId?: string;
};

function DestinationSearchRoot({
  children,
  inputId: providedInputId,
}: DestinationSearchRootProps) {
  const generatedId = useId();
  const inputId = providedInputId ?? `destination-search-${generatedId}`;
  const listboxId = `destination-search-listbox-${generatedId}`;

  const [query, setQueryAtom] = useAtom(destinationQueryAtom);
  const [selectedDestination, setSelectedDestination] = useAtom(
    selectedDestinationAtom,
  );
  const [isOpen, setIsOpen] = useAtom(destinationSearchOpenAtom);
  const [activeIndex, setActiveIndexAtom] = useAtom(destinationActiveIndexAtom);
  const setError = useSetAtom(destinationValidationErrorAtom);
  const error = useAtomValue(destinationValidationErrorAtom);
  const [isSelecting, setIsSelecting] = useAtom(isSelectingDestinationAtom);

  // Session token for Google Places billing — reused for autocomplete + detail
  const sessionTokenRef = useRef<string>(generateSessionToken());

  // Debounced query drives the API call
  const debouncedQuery = useDebounced(query);
  const searchEnabled = debouncedQuery.trim().length >= 2;

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["destination-search", debouncedQuery.trim()],
    queryFn: () =>
      fetchDestinationSuggestions(
        debouncedQuery.trim(),
        sessionTokenRef.current,
      ),
    enabled: searchEnabled,
    staleTime: 30_000,
    gcTime: 60_000,
    placeholderData: (prev) => prev,
    retry: 1,
  });

  const isSearching = searchEnabled && isFetching;
  const isEmpty =
    searchEnabled && !isFetching && suggestions.length === 0;

  // Reset active index when suggestions list changes
  useEffect(() => {
    setActiveIndexAtom(0);
  }, [suggestions, setActiveIndexAtom]);

  const setQuery = useCallback(
    (nextQuery: string) => {
      setQueryAtom(nextQuery);
      setIsOpen(true);
      setActiveIndexAtom(0);
      setError(null);

      if (selectedDestination && nextQuery !== selectedDestination.name) {
        setSelectedDestination(null);
      }
    },
    [
      selectedDestination,
      setActiveIndexAtom,
      setError,
      setIsOpen,
      setQueryAtom,
      setSelectedDestination,
    ],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: DestinationSuggestion) => {
      setQueryAtom(suggestion.mainText);
      setIsOpen(false);
      setActiveIndexAtom(0);
      setError(null);
      setIsSelecting(true);

      const currentToken = sessionTokenRef.current;
      // Start a fresh session for the next search
      sessionTokenRef.current = generateSessionToken();

      void (async () => {
        let coordinates: { latitude: number; longitude: number } | undefined;

        if (suggestion.coordinates) {
          // Mapbox returns coordinates inline — no extra request needed
          coordinates = {
            latitude: suggestion.coordinates.lat,
            longitude: suggestion.coordinates.lng,
          };
        } else {
          // Google Places requires a separate detail call for coordinates
          const coords = await fetchDestinationCoordinates(
            suggestion.providerPlaceId,
            suggestion.provider,
            currentToken,
          );

          if (coords) {
            coordinates = { latitude: coords.lat, longitude: coords.lng };
          }
        }

        setSelectedDestination({
          id: suggestion.providerPlaceId,
          provider: suggestion.provider,
          name: suggestion.mainText,
          type: inferDestinationType(suggestion.types),
          country: suggestion.secondaryText,
          sessionToken: currentToken,
          coordinates,
        });

        setIsSelecting(false);
      })();
    },
    [
      setActiveIndexAtom,
      setError,
      setIsOpen,
      setIsSelecting,
      setQueryAtom,
      setSelectedDestination,
    ],
  );

  const getOptionId = useCallback(
    (suggestionId: string) => `${listboxId}-option-${suggestionId}`,
    [listboxId],
  );

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (!suggestions.length) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndexAtom((current) =>
          current >= suggestions.length - 1 ? 0 : current + 1,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndexAtom((current) =>
          current <= 0 ? suggestions.length - 1 : current - 1,
        );
        return;
      }

      if (event.key === "Enter" && isOpen) {
        event.preventDefault();
        const target = suggestions[activeIndex] ?? suggestions[0];
        if (target) {
          handleSuggestionSelect(target);
        }
      }
    },
    [
      activeIndex,
      handleSuggestionSelect,
      isOpen,
      setActiveIndexAtom,
      setIsOpen,
      suggestions,
    ],
  );

  const contextValue = useMemo<DestinationSearchContextValue>(
    () => ({
      activeIndex,
      error,
      inputId,
      isEmpty,
      isOpen,
      isSearching,
      isSelecting,
      listboxId,
      query,
      selectedDestination,
      suggestions,
      getOptionId,
      handleInputKeyDown,
      handleSuggestionSelect,
      setActiveIndex: setActiveIndexAtom,
      setIsOpen,
      setQuery,
    }),
    [
      activeIndex,
      error,
      getOptionId,
      handleInputKeyDown,
      handleSuggestionSelect,
      inputId,
      isEmpty,
      isOpen,
      isSearching,
      isSelecting,
      listboxId,
      query,
      selectedDestination,
      setActiveIndexAtom,
      setIsOpen,
      setQuery,
      suggestions,
    ],
  );

  return (
    <DestinationSearchContext.Provider value={contextValue}>
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsOpen(false);
          }
        }}
      >
        {children}
      </div>
    </DestinationSearchContext.Provider>
  );
}

// --- Input ---

type DestinationSearchInputProps = {
  "aria-label": string;
  errorMessageId?: string;
  placeholder?: string;
};

function DestinationSearchInput({
  "aria-label": ariaLabel,
  errorMessageId,
  placeholder,
}: DestinationSearchInputProps) {
  const {
    activeIndex,
    error,
    getOptionId,
    inputId,
    isOpen,
    isSearching,
    isSelecting,
    listboxId,
    query,
    setIsOpen,
    setQuery,
    suggestions,
    handleInputKeyDown,
  } = useDestinationSearchContext();
  const activeSuggestion = suggestions[activeIndex];

  return (
    <div className="relative">
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeSuggestion
            ? getOptionId(activeSuggestion.providerPlaceId)
            : undefined
        }
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        aria-label={ariaLabel}
        aria-describedby={error ? errorMessageId : undefined}
        aria-busy={isSearching}
        value={query}
        placeholder={placeholder}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleInputKeyDown}
        className={cn(
          "w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30",
          (error) && "border-destructive focus:ring-destructive/30",
          isSelecting && "opacity-70",
        )}
      />
      {isSearching ? (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

// --- Listbox ---

function DestinationSearchListbox() {
  const { inputId, isEmpty, isOpen, isSearching, listboxId, query, suggestions } =
    useDestinationSearchContext();

  if (!isOpen) {
    return null;
  }

  const groupedSuggestions = destinationTypes
    .map((type) => ({
      type,
      suggestions: suggestions.filter(
        (s) => inferDestinationType(s.types) === type,
      ),
    }))
    .filter((group) => group.suggestions.length > 0);

  return (
    <div
      id={listboxId}
      role="listbox"
      aria-labelledby={inputId}
      className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
    >
      {isSearching && suggestions.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching destinations…
        </div>
      ) : isEmpty ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No destinations found for &ldquo;{query}&rdquo;.
        </div>
      ) : groupedSuggestions.length > 0 ? (
        groupedSuggestions.map((group) => (
          <DestinationSearchGroup key={group.type} group={group} />
        ))
      ) : query.trim().length < 2 ? (
        <div className="px-3 py-3 text-sm text-muted-foreground">
          Type at least 2 characters to search.
        </div>
      ) : null}
    </div>
  );
}

// --- Group ---

function DestinationSearchGroup({
  group,
}: {
  group: { type: DestinationType; suggestions: DestinationSuggestion[] };
}) {
  return (
    <div className="py-1">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {destinationTypeLabels[group.type]}
      </div>
      {group.suggestions.map((suggestion) => (
        <DestinationSearchOption
          key={suggestion.providerPlaceId}
          suggestion={suggestion}
        />
      ))}
    </div>
  );
}

// --- Option ---

function DestinationSearchOption({
  suggestion,
}: {
  suggestion: DestinationSuggestion;
}) {
  const {
    activeIndex,
    getOptionId,
    selectedDestination,
    suggestions,
    handleSuggestionSelect,
    setActiveIndex,
  } = useDestinationSearchContext();
  const optionIndex = suggestions.findIndex(
    (s) => s.providerPlaceId === suggestion.providerPlaceId,
  );
  const isActive = activeIndex === optionIndex;
  const isSelected = selectedDestination?.id === suggestion.providerPlaceId;

  return (
    <button
      id={getOptionId(suggestion.providerPlaceId)}
      type="button"
      role="option"
      aria-selected={isSelected}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => setActiveIndex(optionIndex)}
      onClick={() => handleSuggestionSelect(suggestion)}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30",
        isActive
          ? "bg-muted text-foreground"
          : "text-foreground hover:bg-muted/70",
      )}
    >
      <MapPin className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{suggestion.mainText}</span>
        {suggestion.secondaryText ? (
          <span className="block text-xs text-muted-foreground">
            {suggestion.secondaryText}
          </span>
        ) : null}
      </span>
      {isSelected ? <Check className="size-4 text-primary" /> : null}
    </button>
  );
}

export const DestinationSearch = Object.assign(DestinationSearchRoot, {
  Input: DestinationSearchInput,
  Listbox: DestinationSearchListbox,
  Option: DestinationSearchOption,
});
