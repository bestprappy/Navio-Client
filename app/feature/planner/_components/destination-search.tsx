"use client";

import {
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useMemo,
} from "react";
import { Check, MapPin } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { cn } from "@/lib/utils";

import {
  destinationActiveIndexAtom,
  destinationQueryAtom,
  destinationSearchOpenAtom,
  destinationValidationErrorAtom,
  filteredDestinationsAtom,
  selectedDestinationAtom,
} from "./planner-setup.atoms";
import {
  destinationTypeLabels,
  destinationTypes,
  type Destination,
  type DestinationType,
} from "./data";

type DestinationSearchContextValue = {
  activeIndex: number;
  error: string | null;
  inputId: string;
  isOpen: boolean;
  listboxId: string;
  options: Destination[];
  query: string;
  selectedDestination: Destination | null;
  getOptionId: (destinationId: string) => string;
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  selectDestination: (destination: Destination) => void;
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
  const options = useAtomValue(filteredDestinationsAtom);

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

  const selectDestination = useCallback(
    (destination: Destination) => {
      setSelectedDestination(destination);
      setQueryAtom(destination.name);
      setIsOpen(false);
      setActiveIndexAtom(0);
      setError(null);
    },
    [
      setActiveIndexAtom,
      setError,
      setIsOpen,
      setQueryAtom,
      setSelectedDestination,
    ],
  );

  const getOptionId = useCallback(
    (destinationId: string) => `${listboxId}-option-${destinationId}`,
    [listboxId],
  );

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (!options.length) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndexAtom((currentIndex) =>
          currentIndex >= options.length - 1 ? 0 : currentIndex + 1,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndexAtom((currentIndex) =>
          currentIndex <= 0 ? options.length - 1 : currentIndex - 1,
        );
        return;
      }

      if (event.key === "Enter" && isOpen) {
        event.preventDefault();
        selectDestination(options[activeIndex] ?? options[0]);
      }
    },
    [
      activeIndex,
      isOpen,
      options,
      selectDestination,
      setActiveIndexAtom,
      setIsOpen,
    ],
  );

  const contextValue = useMemo<DestinationSearchContextValue>(
    () => ({
      activeIndex,
      error,
      inputId,
      isOpen,
      listboxId,
      options,
      query,
      selectedDestination,
      getOptionId,
      handleInputKeyDown,
      selectDestination,
      setActiveIndex: setActiveIndexAtom,
      setIsOpen,
      setQuery,
    }),
    [
      activeIndex,
      error,
      getOptionId,
      handleInputKeyDown,
      inputId,
      isOpen,
      listboxId,
      options,
      query,
      selectedDestination,
      selectDestination,
      setActiveIndexAtom,
      setIsOpen,
      setQuery,
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
    listboxId,
    options,
    query,
    setIsOpen,
    setQuery,
    handleInputKeyDown,
  } = useDestinationSearchContext();
  const activeDestination = options[activeIndex];

  return (
    <input
      id={inputId}
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-activedescendant={
        isOpen && activeDestination ? getOptionId(activeDestination.id) : undefined
      }
      aria-expanded={isOpen}
      aria-invalid={Boolean(error)}
      aria-label={ariaLabel}
      aria-describedby={error ? errorMessageId : undefined}
      value={query}
      placeholder={placeholder}
      onChange={(event) => setQuery(event.target.value)}
      onFocus={() => setIsOpen(true)}
      onKeyDown={handleInputKeyDown}
      className={cn(
        "w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30",
        error && "border-destructive focus:ring-destructive/30",
      )}
    />
  );
}

function DestinationSearchListbox() {
  const { inputId, isOpen, listboxId, options } =
    useDestinationSearchContext();

  if (!isOpen) {
    return null;
  }

  const groupedOptions = destinationTypes
    .map((type) => ({
      type,
      destinations: options.filter((destination) => destination.type === type),
    }))
    .filter((group) => group.destinations.length > 0);

  return (
    <div
      id={listboxId}
      role="listbox"
      aria-labelledby={inputId}
      className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg"
    >
      {groupedOptions.length ? (
        groupedOptions.map((group) => (
          <DestinationSearchGroup key={group.type} group={group} />
        ))
      ) : (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No destinations found.
        </div>
      )}
    </div>
  );
}

function DestinationSearchGroup({
  group,
}: {
  group: { type: DestinationType; destinations: Destination[] };
}) {
  return (
    <div className="py-1">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {destinationTypeLabels[group.type]}
      </div>
      {group.destinations.map((destination) => (
        <DestinationSearchOption
          key={destination.id}
          destination={destination}
        />
      ))}
    </div>
  );
}

function DestinationSearchOption({
  destination,
}: {
  destination: Destination;
}) {
  const {
    activeIndex,
    getOptionId,
    options,
    selectedDestination,
    selectDestination,
    setActiveIndex,
  } = useDestinationSearchContext();
  const optionIndex = options.findIndex((option) => option.id === destination.id);
  const isActive = activeIndex === optionIndex;
  const isSelected = selectedDestination?.id === destination.id;

  return (
    <button
      id={getOptionId(destination.id)}
      type="button"
      role="option"
      aria-selected={isSelected}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => setActiveIndex(optionIndex)}
      onClick={() => selectDestination(destination)}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30",
        isActive ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/70",
      )}
    >
      <MapPin className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{destination.name}</span>
        <span className="block text-xs text-muted-foreground">
          {destination.country}
        </span>
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
