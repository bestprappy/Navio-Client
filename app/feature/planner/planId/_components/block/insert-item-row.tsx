"use client";

import { useRef } from "react";
import { Bookmark, CheckSquare, FileText, MapPin, Plus, SeparatorHorizontal, X, Zap } from "lucide-react";
import { useSetAtom } from "jotai";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddPlaceInput, type PlaceSearchBias } from "../place/add-place-input";
import { addChecklistToBlockAtom, addNoteToBlockAtom, addSectionToBlockAtom } from "../overview/trip-builder.atoms";
import { useRevealPlanCard } from "../itinerary/use-reveal-plan-card";

type InsertItemRowProps = {
  blockId: string;
  beforeItemId?: string;
  afterItemId?: string;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchBias?: PlaceSearchBias;
  onAddEvStation: () => void;
  canAddEvStation: boolean;
  onSavedPlaces?: (trigger: HTMLButtonElement | null) => void;
  savedPickerOpen?: boolean;
  /** Days can be split into sections; lists cannot. */
  canAddSection?: boolean;
};

/**
 * A + button sitting on a card's edge: the bottom edge for the gap after it,
 * the top edge for the gap before the first card. It shows on hover or focus
 * (always on touch screens) and takes no space of its own.
 */
export function InsertItemRow({ blockId, beforeItemId, afterItemId, label, open, onOpenChange, searchBias, onAddEvStation, canAddEvStation, onSavedPlaces, savedPickerOpen = false, canAddSection = false }: InsertItemRowProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const addNote = useSetAtom(addNoteToBlockAtom);
  const addChecklist = useSetAtom(addChecklistToBlockAtom);
  const addSection = useSetAtom(addSectionToBlockAtom);
  const reveal = useRevealPlanCard();
  const menuItemClass = "min-h-10 gap-3 px-3 text-foreground data-highlighted:bg-muted data-highlighted:text-foreground";

  function close() {
    onOpenChange(false);
    triggerRef.current?.focus();
  }

  function addTextItem(kind: "note" | "checklist" | "section") {
    const payload = { blockId, beforeItemId };
    const id = kind === "note" ? addNote(payload) : kind === "section" ? addSection(payload) : addChecklist(payload);
    if (id) reveal(blockId, id);
    onOpenChange(false);
  }

  return (
    <div className={`relative min-w-0 ${open ? "pt-6" : ""}`} data-no-drag data-insertion-before={beforeItemId} data-insertion-after={afterItemId}>
      <div className="group/insertion-edge absolute inset-x-0 -top-3 z-10 flex h-6 items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            ref={triggerRef}
            aria-label={`Add an item here: ${label.toLowerCase()}`}
            title={label}
            className={`group/insertion-trigger flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-primary focus-visible:opacity-100 focus-visible:outline-none data-popup-open:opacity-100 data-popup-open:text-primary group-hover/insertion-edge:opacity-100 group-focus-within/plan-card:opacity-100 [@media(hover:none)]:opacity-100 motion-reduce:transition-none ${open || savedPickerOpen ? "opacity-100" : ""}`}
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card shadow-xs group-hover/insertion-trigger:border-primary group-focus-visible/insertion-trigger:border-primary group-focus-visible/insertion-trigger:ring-2 group-focus-visible/insertion-trigger:ring-ring/50 group-data-popup-open/insertion-trigger:border-primary">
              <Plus className="size-4" aria-hidden="true" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-52 p-1.5" finalFocus={open || savedPickerOpen ? false : undefined}>
            <DropdownMenuItem className={menuItemClass} onClick={() => onOpenChange(true)}>
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />Add a place
            </DropdownMenuItem>
            {onSavedPlaces && <DropdownMenuItem className={menuItemClass} onClick={() => onSavedPlaces(triggerRef.current)}>
              <Bookmark className="size-4 text-muted-foreground" aria-hidden="true" />Saved places
            </DropdownMenuItem>}
            <DropdownMenuItem className={menuItemClass} onClick={() => addTextItem("note")}>
              <FileText className="size-4 text-muted-foreground" aria-hidden="true" />Add a note
            </DropdownMenuItem>
            <DropdownMenuItem className={menuItemClass} onClick={() => addTextItem("checklist")}>
              <CheckSquare className="size-4 text-muted-foreground" aria-hidden="true" />Add a checklist
            </DropdownMenuItem>
            <DropdownMenuItem className={menuItemClass} disabled={!canAddEvStation} onClick={() => { onOpenChange(false); onAddEvStation(); }}>
              <Zap className="size-4 text-muted-foreground" aria-hidden="true" />Add an EV station
            </DropdownMenuItem>
            {canAddSection ? (
              <DropdownMenuItem className={menuItemClass} onClick={() => addTextItem("section")}>
                <SeparatorHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />Start a new section
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && (
        <div
          className="min-w-0 space-y-2 rounded-sm border border-border bg-muted/30 p-3"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 text-xs font-medium text-foreground">{label}</p>
            <button type="button" aria-label="Cancel adding a place here" className="flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" onClick={close}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <AddPlaceInput blockId={blockId} beforeItemId={beforeItemId} searchBias={searchBias} autoFocus onSearchStarted={() => onOpenChange(false)} />
        </div>
      )}
    </div>
  );
}
