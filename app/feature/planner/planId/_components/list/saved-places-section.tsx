"use client";

import { useState, type ReactElement, type ComponentProps } from "react";
import Image from "next/image";
import { useAtomValue, useSetAtom } from "jotai";
import {
  Bookmark,
  CalendarPlus,
  Check,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePicker } from "@/components/ui/responsive-picker";
import {
  plannerReadOnlyAtom,
  tripBlocksAtom,
} from "../overview/trip-builder.atoms";
import {
  savedListPlacesAtom,
  scheduleSavedPlaceAtom,
} from "./saved-places.atoms";
import {
  savedPlaceKey,
  scheduledDays,
} from "./saved-places-model";
import type { PlaceItem } from "../constants/types";

export function SavedPlaceThumbnail({ place }: { place: PlaceItem }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/5 text-primary">
      {place.imageUrl && !failed ? (
        <Image
          src={place.imageUrl}
          alt=""
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <MapPin className="size-5" aria-hidden="true" />
      )}
    </span>
  );
}

export function DaySavedPlacesPicker({ dayId, beforeItemId, open: controlledOpen, onOpenChange, trigger, finalFocus }: {
  dayId: string;
  beforeItemId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement | null;
  finalFocus?: ComponentProps<typeof ResponsivePicker>["finalFocus"];
}) {
  const saved = useAtomValue(savedListPlacesAtom);
  const blocks = useAtomValue(tripBlocksAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const schedule = useSetAtom(scheduleSavedPlaceAtom);
  const [localOpen, setOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  if (readOnly) return null;
  const visible = saved.filter(({ place }) =>
    `${place.name} ${place.address}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <ResponsivePicker
      desktop={trigger === null ? "dialog" : "popover"}
      finalFocus={finalFocus}
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        onOpenChange?.(value);
        if (!value) {
          setSearch("");
          setMessage("");
        }
      }}
      title="Saved places"
      description="Add from My List to this day. Your saved copy stays in My List."
      trigger={trigger === undefined ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
          aria-label={`Saved places (${saved.length})`}
        >
          <Bookmark className="size-4" aria-hidden="true" />
          <span className="hidden @lg/planner:inline">Saved places</span>
          <span className="text-xs tabular-nums">{saved.length}</span>
        </Button>
      ) : trigger}
    >
      <Input
        aria-label="Search places for this day"
        placeholder="Find a saved place"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="rounded-xl"
      />
      <div className="max-h-80 space-y-1 overflow-y-auto">
        {!saved.length && (
          <p className="py-3 text-sm text-muted-foreground">
            Add places from Explore or your lists first.
          </p>
        )}
        {!!saved.length && !visible.length && (
          <p className="py-3 text-sm text-muted-foreground">
            No saved places match your search.
          </p>
        )}
        {visible.map(({ place }) => {
          const added = scheduledDays(blocks, place).some(
            (day) => day.id === dayId,
          );
          return (
            <Button
              type="button"
              key={savedPlaceKey(place)}
              variant="ghost"
              disabled={added}
              className="h-auto min-h-16 w-full justify-start gap-3 whitespace-normal px-2 py-2 text-left"
              onClick={() => {
                const id = schedule({ placeId: savedPlaceKey(place), dayId, beforeItemId });
                setMessage(id ? `${place.name} added to this day.` : "The insertion point changed. Close this picker and choose a gap again.");
              }}
            >
              <SavedPlaceThumbnail place={place} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{place.name}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {place.address}
                </span>
              </span>
              {added ? (
                <Check
                  className="size-4 shrink-0"
                  aria-label="Already added to this day"
                />
              ) : (
                <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
              )}
            </Button>
          );
        })}
      </div>
      <p role="status" className="text-xs text-primary">
        {message}
      </p>
    </ResponsivePicker>
  );
}
