"use client";

import { useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import type { PlaceItem, TripBlockColorId } from "../constants/types";
import { useTripBlockColorResolver } from "../constants/use-trip-block-color";
import { plannerReadOnlyAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";
import { getDayDestinations } from "../place/place-destinations";
import { AddToDayMenu } from "./add-to-day-menu";
import { savedListPlacesAtom, scheduleSavedPlacesAtom } from "./saved-places.atoms";
import { savedPlaceKey, scheduledDays } from "./saved-places-model";
import { SavedPlaceThumbnail } from "./saved-places-section";

function describeResult(added: number, skipped: number, dayLabel: string): string {
  if (added === 0) return `Already in ${dayLabel}.`;
  const addedText = `Added ${added} ${added === 1 ? "place" : "places"} to ${dayLabel}.`;
  return skipped ? `${addedText} ${skipped} ${skipped === 1 ? "was" : "were"} already there.` : addedText;
}

type SummaryPlaceRowProps = {
  place: PlaceItem;
  listTitle: string;
  listColorId: TripBlockColorId;
  scheduledLabels: string[];
  selected: boolean;
  readOnly: boolean;
  onSelectedChange: (selected: boolean) => void;
  onAddToDay: (dayId: string) => void;
};

/** A saved place as one horizontal card: select it, see where it is, add it to a day. */
function SummaryPlaceRow({
  place, listTitle, listColorId, scheduledLabels, selected, readOnly, onSelectedChange, onAddToDay,
}: SummaryPlaceRowProps) {
  const blocks = useAtomValue(tripBlocksAtom);
  const resolveColor = useTripBlockColorResolver();
  const days = useMemo(() => getDayDestinations(blocks, [place]), [blocks, place]);
  const checkboxId = `my-list-summary-${place.id}`;
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors",
        selected ? "border-primary/50 bg-primary/5" : "border-border/70 hover:border-border",
      )}
    >
      {!readOnly && (
        <Checkbox
          id={checkboxId}
          checked={selected}
          onCheckedChange={(checked) => onSelectedChange(checked === true)}
          aria-label={`Select ${place.name}`}
        />
      )}
      {/* The whole card body toggles selection, so picking many places is quick. */}
      <label htmlFor={readOnly ? undefined : checkboxId} className={cn("flex min-w-0 flex-1 items-center gap-3", !readOnly && "cursor-pointer")}>
        <SavedPlaceThumbnail place={place} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold" title={place.name}>{place.name}</span>
          {place.address && <span className="block truncate text-xs text-muted-foreground" title={place.address}>{place.address}</span>}
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: resolveColor(listColorId).value }} />
            <span className="truncate">{listTitle}</span>
            {scheduledLabels.length > 0 && <span className="shrink-0 font-medium text-primary">In {scheduledLabels.join(", ")}</span>}
          </span>
        </span>
      </label>
      {!readOnly && (
        <AddToDayMenu
          days={days}
          onSelect={onAddToDay}
          label="Add to day"
          ariaLabel={`Add ${place.name} to a day`}
          variant="outline"
          compactLabel
        />
      )}
    </li>
  );
}

/** My List as one list of places, for adding many of them to a day at once. */
export function MyListSummary() {
  const saved = useAtomValue(savedListPlacesAtom);
  const blocks = useAtomValue(tripBlocksAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const scheduleMany = useSetAtom(scheduleSavedPlacesAtom);
  const [selection, setSelection] = useState<ReadonlySet<string>>(() => new Set());
  const [message, setMessage] = useState("");

  const listColors = useMemo(() => new Map(blocks.map((block) => [block.id, block.colorId])), [blocks]);
  // A place removed from its list drops out of the selection on its own.
  const selected = useMemo(
    () => saved.filter(({ place }) => selection.has(savedPlaceKey(place))),
    [saved, selection],
  );
  const bulkDays = useMemo(() => getDayDestinations(blocks, selected.map(({ place }) => place)), [blocks, selected]);
  const allSelected = saved.length > 0 && selected.length === saved.length;

  const setSelected = (key: string, isSelected: boolean) => setSelection((current) => {
    const next = new Set(current);
    if (isSelected) next.add(key); else next.delete(key);
    return next;
  });
  const addToDay = (placeIds: string[], dayId: string) => {
    const dayLabel = getDayDestinations(blocks, []).find((day) => day.blockId === dayId)?.label ?? "that day";
    const { added, skipped } = scheduleMany({ placeIds, dayId });
    setMessage(describeResult(added, skipped, dayLabel));
  };

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
        <Bookmark className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">No saved places yet</p>
        <p className="max-w-xs text-xs leading-5 text-muted-foreground">
          Search for a place in one of your lists, or save one from Explore. It will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex min-h-9 items-center justify-between gap-3 px-3">
        {readOnly ? (
          <p className="text-sm text-muted-foreground">{saved.length} saved {saved.length === 1 ? "place" : "places"}</p>
        ) : (
          <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
            <Checkbox
              checked={allSelected}
              indeterminate={selected.length > 0 && !allSelected}
              onCheckedChange={(checked) => setSelection(checked === true ? new Set(saved.map(({ place }) => savedPlaceKey(place))) : new Set())}
            />
            Select all {saved.length} {saved.length === 1 ? "place" : "places"}
          </label>
        )}
      </div>
      <p role="status" className="px-3 text-xs text-primary empty:hidden">{message}</p>

      <ul className="space-y-2" aria-label="Saved places">
        {saved.map(({ place, listId, listTitle }) => {
          const key = savedPlaceKey(place);
          return (
            <SummaryPlaceRow
              key={key}
              place={place}
              listTitle={listTitle}
              listColorId={listColors.get(listId) ?? "teal"}
              scheduledLabels={scheduledDays(blocks, place).map((day) => day.label)}
              selected={selection.has(key)}
              readOnly={readOnly}
              onSelectedChange={(isSelected) => setSelected(key, isSelected)}
              onAddToDay={(dayId) => addToDay([key], dayId)}
            />
          );
        })}
      </ul>

      {!readOnly && selected.length > 0 && (
        <div
          role="region"
          aria-label="Selected places"
          className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-popover p-2 pl-4 shadow-lg"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <strong className="font-semibold tabular-nums">{selected.length}</strong>
            <span className="truncate text-muted-foreground">selected</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelection(new Set())}>Clear</Button>
          </span>
          <AddToDayMenu
            days={bulkDays}
            onSelect={(dayId) => {
              addToDay(selected.map(({ place }) => savedPlaceKey(place)), dayId);
              setSelection(new Set());
            }}
            label={`Add ${selected.length} to day`}
            ariaLabel={`Add ${selected.length} selected ${selected.length === 1 ? "place" : "places"} to a day`}
          />
        </div>
      )}
    </div>
  );
}
