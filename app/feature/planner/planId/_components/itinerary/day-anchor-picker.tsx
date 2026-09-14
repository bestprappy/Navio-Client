"use client";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useSession } from "next-auth/react";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  House,
  Loader2,
  MapPin,
  Navigation,
  Pin,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManualAnchorPicker } from "./manual-anchor-picker";
import { SaveFavoritePlaceButton } from "./save-favorite-place-button";
import { cn } from "@/lib/utils";

import { fetchPlaceSearch, type PlaceSearchResult } from "../place/place-api";
import type { PlaceItem, TripAnchor } from "../constants/types";
import type { DayAnchorEdge } from "../overview/trip-builder.atoms";
import { placeItemToAnchor } from "./day-anchors";
import {
  createSavedPlace,
  listSavedPlaces,
  savedPlacesQueryKey,
  type SavedPlace,
} from "./saved-place-api";

type AnchorOption = {
  key: string;
  anchor: TripAnchor;
  group: "saved" | "day" | "search";
  icon: typeof House;
  primary: string;
  secondary: string;
  /** Present when this result is not yet in the address book. */
  savable?: { label: string; name: string; address?: string; providerPlaceId?: string };
};

type DayAnchorPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edge: DayAnchorEdge;
  dayLabel: string;
  current: TripAnchor | null;
  /** Whether this day has an explicit place selection that can be cleared. */
  canClear: boolean;
  carriedOverName: string | null;
  dayPlaces: PlaceItem[];
  searchBias?: { lat: number; lng: number };
  onSelect: (anchor: TripAnchor | null) => void;
};

function savedPlaceIcon(kind: SavedPlace["kind"]) {
  if (kind === "HOME") return House;
  if (kind === "WORK") return Briefcase;
  return MapPin;
}

function savedPlaceToAnchor(place: SavedPlace): TripAnchor {
  return {
    id: place.id,
    kind: "SAVED_PLACE",
    name: place.label,
    address: place.address ?? undefined,
    lat: place.lat,
    lng: place.lng,
  };
}

function searchResultToAnchor(result: PlaceSearchResult): TripAnchor {
  return {
    id: result.providerPlaceId,
    kind: "PLACE",
    name: result.name,
    address: result.address || undefined,
    lat: result.lat,
    lng: result.lng,
  };
}

export function DayAnchorPicker({ open, onOpenChange, ...rest }: DayAnchorPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] grid-cols-1 gap-3 overflow-x-hidden overflow-y-auto overscroll-contain sm:max-w-lg">
        {/* Mounted only while open, so every visit starts from a clean search
            rather than needing an effect to reset it. */}
        {open && <PickerBody onOpenChange={onOpenChange} {...rest} />}
      </DialogContent>
    </Dialog>
  );
}

type PickerBodyProps = Omit<DayAnchorPickerProps, "open">;

function PickerBody({
  onOpenChange,
  edge,
  dayLabel,
  current,
  canClear,
  carriedOverName,
  dayPlaces,
  searchBias,
  onSelect,
}: PickerBodyProps) {
  const listId = useId();
  const [pinning, setPinning] = useState(false);
  const { isAuthenticated, isAuthenticationLoading, requireAuth } = useRequireAuth();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [requestedIndex, setRequestedIndex] = useState(0);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const savedPlaces = useQuery({
    queryKey: [...savedPlacesQueryKey, session?.user?.id],
    queryFn: ({ signal }) => listSavedPlaces(signal),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: 1,
  });

  const results = useQuery({
    queryKey: ["anchor-place-search", search, searchBias?.lat, searchBias?.lng],
    queryFn: () => fetchPlaceSearch(search, searchBias),
    enabled: search.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });

  const saveToAddressBook = useMutation({
    mutationFn: createSavedPlace,
    onSuccess: async (place) => {
      setJustSavedId(place.providerPlaceId ?? place.id);
      await queryClient.invalidateQueries({ queryKey: savedPlacesQueryKey });
    },
  });

  const savedIds = useMemo(
    () =>
      new Set(
        (isAuthenticated ? savedPlaces.data ?? [] : [])
          .map((place) => place.providerPlaceId)
          .filter((id): id is string => Boolean(id)),
      ),
    [isAuthenticated, savedPlaces.data],
  );

  const options = useMemo<AnchorOption[]>(() => {
    const saved = (isAuthenticated ? savedPlaces.data ?? [] : []).map<AnchorOption>((place) => ({
      key: `saved:${place.id}`,
      anchor: savedPlaceToAnchor(place),
      group: "saved",
      icon: savedPlaceIcon(place.kind),
      primary: place.label,
      secondary: place.address ?? place.name,
    }));

    const stops = dayPlaces.map<AnchorOption>((item) => ({
      key: `day:${item.id}`,
      anchor: placeItemToAnchor(item),
      group: "day",
      icon: Pin,
      primary: item.name,
      secondary: item.address,
    }));

    const found = (results.data ?? []).map<AnchorOption>((result) => ({
      key: `search:${result.id}`,
      anchor: searchResultToAnchor(result),
      group: "search",
      icon: MapPin,
      primary: result.name,
      secondary: result.address,
      savable: savedIds.has(result.providerPlaceId)
        ? undefined
        : {
            label: result.name,
            name: result.name,
            address: result.address || undefined,
            providerPlaceId: result.providerPlaceId,
          },
    }));

    return [...saved, ...stops, ...found];
  }, [isAuthenticated, savedPlaces.data, dayPlaces, results.data, savedIds]);

  // Clamped on read rather than corrected in an effect, so a shrinking result
  // list can never leave the highlight pointing past the end.
  const activeIndex = Math.min(requestedIndex, Math.max(options.length - 1, 0));

  function moveActive(delta: number) {
    if (!options.length) return;
    const next = (activeIndex + delta + options.length) % options.length;
    setRequestedIndex(next);
    optionRefs.current[next]?.scrollIntoView({ block: "nearest" });
  }

  const isStart = edge === "start";
  const title = isStart ? `Where does ${dayLabel} start?` : `Where does ${dayLabel} end?`;
  const description = isStart
    ? "Pick the place you set out from. The day before ends here too, so the two always agree."
    : "Pick tonight's stop. Tomorrow starts here unless you change it.";

  const groups = [
    { id: "saved" as const, label: "Favorite places" },
    { id: "day" as const, label: `Stops on ${dayLabel.toLowerCase()}` },
    { id: "search" as const, label: "Search results" },
  ];

  const header = (
    <DialogHeader className="min-w-0 pr-7">
      <DialogTitle className="flex items-center gap-2 leading-snug">
        <Navigation
          className={cn("size-4 shrink-0 text-primary", !isStart && "rotate-90")}
          aria-hidden="true"
        />
        {title}
      </DialogTitle>
      <DialogDescription className="break-words">{description}</DialogDescription>
    </DialogHeader>
  );

  // Pinning replaces the search view rather than stacking under it, so the
  // dialog never grows into a long scroll with focus lost below the fold.
  if (pinning) {
    return (
      <>
        {header}
        <ManualAnchorPicker
          initial={current ?? searchBias ?? { lat: 13.7563, lng: 100.5018 }}
          onBack={() => setPinning(false)}
          onSelect={(anchor) => {
            onSelect(anchor);
            onOpenChange(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      {header}

      {current && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="min-w-0 truncate text-sm font-medium">{current.name}</p>
          <SaveFavoritePlaceButton key={`${current.id}:${current.lat}:${current.lng}`} anchor={current} />
        </div>
      )}

      <div className="flex min-w-0 gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          autoFocus
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            options[activeIndex] ? `${listId}-option-${activeIndex}` : undefined
          }
          aria-label="Search for a place"
          placeholder="Search a hotel, address or landmark"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setRequestedIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveActive(1);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              moveActive(-1);
            }
            if (event.key === "Enter" && options[activeIndex]) {
              event.preventDefault();
              onSelect(options[activeIndex].anchor);
              onOpenChange(false);
            }
          }}
          className="pl-9"
        />
      </div>
      <Button type="button" variant="outline" onClick={() => setPinning(true)}>
        <Pin aria-hidden="true" />
        <span className="max-sm:sr-only">Pin on map</span>
      </Button>
      </div>

      {results.isFetching && (
        <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Searching places…
        </p>
      )}
      {results.isError && (
        <p role="alert" className="text-xs text-destructive">
          Place search is unavailable right now. Try again or pin a place on the map.
        </p>
      )}
      {savedPlaces.isError && (
        <p role="alert" className="text-xs text-destructive">
          Could not load your saved places. Search for a place instead.
        </p>
      )}
      {saveToAddressBook.isError && (
        <p role="alert" className="text-xs text-destructive">
          {saveToAddressBook.error.message}
        </p>
      )}
      {search.length >= 2 &&
        !results.isFetching &&
        !results.isError &&
        (results.data?.length ?? 0) === 0 && (
          <p className="text-xs text-muted-foreground">
            No places found. Try another address, or use Pin on map.
          </p>
        )}

      <div id={listId} role="listbox" aria-label="Places" className="space-y-3">
        {groups.map((group) => {
          const groupOptions = options
            .map((option, index) => ({ option, index }))
            .filter((entry) => entry.option.group === group.id);

          if (!groupOptions.length) {
            return group.id === "saved" && !savedPlaces.isLoading ? (
              <p
                key={group.id}
                className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground"
              >
                {isAuthenticated
                  ? "No saved places yet. Find your home below and bookmark it for future trips."
                  : "Search or pin a place for this trip. Sign in to keep favorite places for future trips."}
              </p>
            ) : null;
          }

          return (
            <div key={group.id} className="space-y-1">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              {groupOptions.map(({ option, index }) => {
                const Icon = option.icon;
                const isActive = index === activeIndex;
                const isCurrent = current?.id === option.anchor.id;
                return (
                  <div key={option.key} className="flex items-stretch gap-1">
                    <button
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      type="button"
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={isCurrent}
                      tabIndex={isActive ? 0 : -1}
                      onFocus={() => setRequestedIndex(index)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          moveActive(1);
                          optionRefs.current[(index + 1) % options.length]?.focus();
                        }
                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          moveActive(-1);
                          optionRefs.current[
                            (index - 1 + options.length) % options.length
                          ]?.focus();
                        }
                      }}
                      onClick={() => {
                        onSelect(option.anchor);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {option.primary}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.secondary}
                        </span>
                      </span>
                      {isCurrent && (
                        <span className="shrink-0 text-xs font-medium text-primary">
                          Current
                        </span>
                      )}
                    </button>
                    {option.savable && (
                      <button
                        type="button"
                        disabled={isAuthenticationLoading || saveToAddressBook.isPending}
                        aria-label={`Save ${option.primary} to your places`}
                        onClick={() =>
                          requireAuth(() => saveToAddressBook.mutate({
                            label: option.savable!.label.slice(0, 80),
                            kind: "CUSTOM",
                            name: option.savable!.name.slice(0, 255),
                            address: option.savable!.address,
                            providerPlaceId: option.savable!.providerPlaceId,
                            lat: option.anchor.lat,
                            lng: option.anchor.lng,
                          }))
                        }
                        className="flex w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        {justSavedId === option.savable.providerPlaceId ? (
                          <BookmarkCheck className="size-4 text-primary" aria-hidden="true" />
                        ) : (
                          <Bookmark className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {canClear && current && (
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-9 w-full whitespace-normal py-2"
          onClick={() => {
            onSelect(null);
            onOpenChange(false);
          }}
        >
          {carriedOverName ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : (
            <X className="size-4" aria-hidden="true" />
          )}
          {carriedOverName
            ? `Clear ${edge} override and use ${carriedOverName}`
            : `Clear ${isStart ? "start" : "end"} place`}
        </Button>
      )}
    </>
  );
}
