"use client";

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
import { cn } from "@/lib/utils";

import { fetchPlaceSearch, type PlaceSearchResult } from "../place/place-api";
import type { PlaceItem, TripAnchor } from "../constants/types";
import type { DayAnchorEdge } from "../overview/trip-builder.atoms";
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
  /** False on the first day, whose start has no previous day to fall back to. */
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

function placeItemToAnchor(item: PlaceItem): TripAnchor {
  return {
    id: item.placeId,
    kind: "PLACE",
    name: item.name,
    address: item.address || undefined,
    lat: item.lat,
    lng: item.lng,
  };
}

export function DayAnchorPicker({ open, onOpenChange, ...rest }: DayAnchorPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] gap-3 overflow-y-auto sm:max-w-lg">
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
    queryKey: savedPlacesQueryKey,
    queryFn: ({ signal }) => listSavedPlaces(signal),
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
        (savedPlaces.data ?? [])
          .map((place) => place.providerPlaceId)
          .filter((id): id is string => Boolean(id)),
      ),
    [savedPlaces.data],
  );

  const options = useMemo<AnchorOption[]>(() => {
    const saved = (savedPlaces.data ?? []).map<AnchorOption>((place) => ({
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
  }, [savedPlaces.data, dayPlaces, results.data, savedIds]);

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
    { id: "saved" as const, label: "Your places" },
    { id: "day" as const, label: `Stops on ${dayLabel.toLowerCase()}` },
    { id: "search" as const, label: "Search results" },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Navigation
            className={cn("size-4 shrink-0 text-primary", !isStart && "rotate-90")}
            aria-hidden="true"
          />
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="relative">
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

      {results.isFetching && (
        <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Searching places…
        </p>
      )}
      {results.isError && (
        <p role="alert" className="text-xs text-destructive">
          Place search is unavailable right now. Your saved places still work.
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
            No places found. Try a hotel name or a street address.
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
                No saved places yet. Find your home below and use the bookmark
                button — every trip can then start from it in one tap.
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
                        "flex min-h-11 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
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
                        disabled={saveToAddressBook.isPending}
                        aria-label={`Save ${option.primary} to your places`}
                        onClick={() =>
                          saveToAddressBook.mutate({
                            label: option.savable!.label.slice(0, 80),
                            kind: "CUSTOM",
                            name: option.savable!.name.slice(0, 255),
                            address: option.savable!.address,
                            providerPlaceId: option.savable!.providerPlaceId,
                            lat: option.anchor.lat,
                            lng: option.anchor.lng,
                          })
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
          className="w-full"
          onClick={() => {
            onSelect(null);
            onOpenChange(false);
          }}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {carriedOverName
            ? `Follow on from ${carriedOverName}`
            : "Follow on from the day before"}
        </Button>
      )}
    </>
  );
}
