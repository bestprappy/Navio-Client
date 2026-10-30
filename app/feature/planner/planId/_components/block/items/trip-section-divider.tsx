"use client";

import { useId, useState } from "react";
import { ChevronDown, MapPin, Trash2, X } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../../constants/trip-block-colors";
import type { SectionItem, TripBlockColorId, TripDestination } from "../../constants/types";
import { DestinationSearch } from "../../itinerary/destination-search";
import type { SectionSummary } from "../../itinerary/day-sections";
import { plannerReadOnlyAtom, removeItemFromBlockAtom, updateSectionItemAtom } from "../../overview/trip-builder.atoms";
import { TripColorSwatches } from "../trip-color-swatches";

type TripSectionDividerProps = {
  blockId: string;
  blockColorId: TripBlockColorId;
  item: SectionItem;
  summary: SectionSummary;
  /** What folding hid; items added to a folded section stay visible. */
  hiddenSummary: SectionSummary;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

type SectionUpdates = Partial<Pick<SectionItem, "title" | "colorId" | "destination">>;

function describeContents({ itemCount, stopCount }: SectionSummary): string {
  if (itemCount === 0) return "Empty";
  const others = itemCount - stopCount;
  const parts = [
    stopCount ? `${stopCount} ${stopCount === 1 ? "stop" : "stops"}` : null,
    others ? `${others} ${others === 1 ? "item" : "items"}` : null,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * The start of a new part of a day, styled like the day's destination card.
 * Stops below it, up to the next divider, take its colour on the map and are
 * searched near its city.
 */
export function TripSectionDivider({ blockId, blockColorId, item, summary, hiddenSummary, collapsed, onToggleCollapsed }: TripSectionDividerProps) {
  const editorId = useId();
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const updateSection = useSetAtom(updateSectionItemAtom);
  const removeItem = useSetAtom(removeItemFromBlockAtom);
  // A brand-new divider opens ready to be named.
  const [isEditing, setIsEditing] = useState(() => !readOnly && !item.title && !item.destination);
  const color = getTripBlockColorById(item.colorId ?? blockColorId);
  const name = item.title.trim() || item.destination?.name || "New section";
  const contents = describeContents(summary);
  const showsHidden = collapsed && hiddenSummary.itemCount > 0;
  const label = [
    item.destination && item.title.trim() ? `Section in ${item.destination.name}` : "Section",
    showsHidden ? `${describeContents(hiddenSummary)} hidden` : null,
  ].filter(Boolean).join(" · ");

  function update(updates: SectionUpdates) {
    updateSection({ blockId, itemId: item.id, updates });
  }

  return (
    // Grows to fill its row so it lines up with the drag and move controls beside it,
    // which are taller than the card; the + on its bottom edge then sits on the card.
    <section aria-label={`Section: ${name}`} className="flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-border/70 bg-secondary/30 p-3">
      <div className="flex min-h-9 items-center gap-2 text-sm">
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Show" : "Hide"} ${name}, ${contents}`}
          title={collapsed ? "Show this section" : "Hide this section"}
          className="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ color: color.value }}
          onClick={onToggleCollapsed}
        >
          <MapPin className="size-4" aria-hidden="true" />
        </button>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className="block break-words font-semibold">{name}</span>
        </span>
        {readOnly ? null : (
          <>
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: color.value }} aria-hidden="true" />
            <button
              type="button"
              aria-expanded={isEditing}
              aria-controls={editorId}
              aria-label={`Change ${name}: name, city and colour`}
              className="flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-1 text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setIsEditing(!isEditing)}
            >
              Change
              <ChevronDown className={cn("size-4 text-foreground transition-transform motion-reduce:transition-none", isEditing && "rotate-180")} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {isEditing && !readOnly ? (
        <SectionEditor
          id={editorId}
          item={item}
          blockColorId={blockColorId}
          name={name}
          onChange={update}
          onClose={() => setIsEditing(false)}
          onRemove={() => removeItem({ blockId, itemId: item.id })}
        />
      ) : null}
    </section>
  );
}

type SectionCityFieldProps = {
  destination: TripDestination | null;
  onChange: (destination: TripDestination | null) => void;
  onEscape: () => void;
};

/** The chosen city as a card with Change; the search appears only while choosing. */
function SectionCityField({ destination, onChange, onEscape }: SectionCityFieldProps) {
  const [isSearching, setIsSearching] = useState(false);
  const showSearch = !destination || isSearching;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">City</p>
      {destination ? (
        <div className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block break-words font-semibold text-foreground">{destination.name}</span>
            {destination.country ? <span className="block text-xs text-muted-foreground">{destination.country}</span> : null}
          </span>
          <button
            type="button"
            aria-expanded={isSearching}
            aria-label={`Change city from ${destination.name}`}
            className="min-h-9 shrink-0 rounded-lg px-2 text-xs text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIsSearching(!isSearching)}
          >
            {isSearching ? "Cancel" : "Change"}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${destination.name} and use the day's city`}
            title="Use the day's city"
            onClick={() => { onChange(null); setIsSearching(false); }}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Moving to another city? Set it here. Places below this section are searched near it, and later days start from it.
        </p>
      )}
      {showSearch ? (
        <DestinationSearch
          onEscape={() => (destination ? setIsSearching(false) : onEscape())}
          onSelect={(next) => { onChange(next); setIsSearching(false); }}
        />
      ) : null}
    </div>
  );
}

type SectionEditorProps = {
  id: string;
  item: SectionItem;
  blockColorId: TripBlockColorId;
  name: string;
  onChange: (updates: SectionUpdates) => void;
  onClose: () => void;
  onRemove: () => void;
};

function SectionEditor({ id, item, blockColorId, name, onChange, onClose, onRemove }: SectionEditorProps) {
  const nameId = useId();
  const dayColor = getTripBlockColorById(blockColorId);
  return (
    <div
      id={id}
      className="mt-3 space-y-4"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="space-y-1.5">
        <label htmlFor={nameId} className="text-xs font-semibold text-muted-foreground">Section name</label>
        <input
          id={nameId}
          autoFocus
          value={item.title}
          maxLength={120}
          placeholder={item.destination?.name ?? "Afternoon, Old town, Day trip…"}
          onChange={(event) => onChange({ title: event.target.value })}
          className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <SectionCityField
        destination={item.destination ?? null}
        onChange={(destination) => onChange({ destination })}
        onEscape={onClose}
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Colour</p>
        <Button
          type="button"
          variant={item.colorId ? "outline" : "secondary"}
          size="sm"
          aria-pressed={!item.colorId}
          className="justify-start gap-2"
          onClick={() => onChange({ colorId: null })}
        >
          <span className="size-3.5 rounded-full" style={{ backgroundColor: dayColor.value }} aria-hidden="true" />
          Same as day
        </Button>
        <TripColorSwatches
          selectedId={item.colorId ?? null}
          getLabel={(option) => `Use ${option.label} for ${name}`}
          onSelect={(colorId) => onChange({ colorId })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={onClose}><X className="size-4" aria-hidden="true" />Close</Button>
        <Button type="button" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="size-4" aria-hidden="true" />Remove section
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Removing the section keeps its stops in the day.</p>
    </div>
  );
}
