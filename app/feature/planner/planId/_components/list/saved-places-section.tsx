"use client";

import { useState, type ReactElement, type ComponentProps } from "react";
import Image from "next/image";
import { useAtomValue, useSetAtom } from "jotai";
import {
  Bookmark,
  CalendarPlus,
  Check,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePicker } from "@/components/ui/responsive-picker";
import {
  plannerReadOnlyAtom,
  tripBlocksAtom,
  removeItemFromBlockAtom,
} from "../overview/trip-builder.atoms";
import {
  savedListPlacesAtom,
  scheduleSavedPlaceAtom,
} from "./saved-places.atoms";
import {
  itineraryDays,
  savedPlaceKey,
  scheduledDays,
} from "./saved-places-model";
import type { PlaceItem } from "../constants/types";

function SavedPlaceThumbnail({ place }: { place: PlaceItem }) {
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

function PlaceDayPicker({ place }: { place: PlaceItem }) {
  const [open, setOpen] = useState(false);
  const blocks = useAtomValue(tripBlocksAtom);
  const schedule = useSetAtom(scheduleSavedPlaceAtom);
  const days = itineraryDays(blocks);
  const assigned = scheduledDays(blocks, place);
  return (
    <ResponsivePicker
      desktop="popover"
      open={open}
      onOpenChange={setOpen}
      title="Add to a day"
      description={place.name}
      trigger={
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Add ${place.name} to a day`}
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          <span className="hidden @sm/planner:inline">Add to day</span>
        </Button>
      }
    >
      <div className="space-y-1">
        {days.length === 0 && (
          <p className="py-3 text-sm text-muted-foreground">
            Create an itinerary day first.
          </p>
        )}
        {days.map((day) => {
          const added = assigned.some((entry) => entry.id === day.id);
          return (
            <Button
              key={day.id}
              type="button"
              variant="ghost"
              disabled={added}
              className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal py-2 text-left"
              onClick={() => {
                schedule({ placeId: savedPlaceKey(place), dayId: day.id });
                setOpen(false);
              }}
            >
              <span>
                {day.label}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {day.date}
                </span>
              </span>
              {added ? (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Check className="size-3.5" />
                  Added
                </span>
              ) : (
                <CalendarPlus className="size-4 shrink-0" />
              )}
            </Button>
          );
        })}
      </div>
    </ResponsivePicker>
  );
}

export function SavedPlacesSection() {
  const saved = useAtomValue(savedListPlacesAtom);
  const blocks = useAtomValue(tripBlocksAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const remove = useSetAtom(removeItemFromBlockAtom);
  const [search, setSearch] = useState("");
  const visible = saved.filter(({ place, listTitle }) =>
    `${place.name} ${place.address} ${listTitle}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <Accordion
      defaultValue={["places"]}
      className="mb-6 rounded-2xl border border-border bg-card"
    >
      <AccordionItem value="places" className="border-none">
        <AccordionTrigger className="px-4 py-4 hover:no-underline">
          <span className="flex min-w-0 items-center gap-2.5">
            <Bookmark className="size-4 text-primary" aria-hidden="true" />
            <span>Places</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {saved.length}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Saved across your lists. Add to a day whenever you’re ready.
          </p>
          {saved.length > 0 && (
            <label className="relative mb-3 block">
              <Search
                className="absolute left-3 top-3 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Search saved places"
                placeholder="Find a saved place"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 rounded-xl pl-9"
              />
            </label>
          )}
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {!saved.length && (
              <p className="rounded-xl bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
                Add places to a list below, or save them from Explore.
              </p>
            )}
            {!!saved.length && !visible.length && (
              <p className="py-3 text-sm text-muted-foreground">
                No saved places match your search.
              </p>
            )}
            {visible.map(({ place, listTitle, listId }) => {
              const assigned = scheduledDays(blocks, place);
              return (
                <div
                  key={savedPlaceKey(place)}
                  className="flex items-center gap-3 rounded-xl py-3"
                >
                  <SavedPlaceThumbnail place={place} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="mb-0! truncate text-sm font-medium"
                      title={place.name}
                    >
                      {place.name}
                    </p>
                    <p
                      className="mb-0! truncate text-xs text-muted-foreground"
                      title={place.address}
                    >
                      {place.address || listTitle}
                    </p>
                    {assigned.length > 0 && (
                      <p className="mb-0! mt-1 break-words text-xs text-primary">
                        Added to {assigned.map((day) => day.label).join(", ")}
                      </p>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex shrink-0 items-center gap-1">
                      <PlaceDayPicker place={place} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${place.name} from ${listTitle}`}
                        onClick={() =>
                          remove({ blockId: listId, itemId: place.id })
                        }
                      >
                        <Trash2
                          className="size-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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
