"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckSquare, FileText } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { TripBlockData } from "../constants/types";
import { getTripBlockColorById } from "../constants/trip-block-colors";
import {
  AddPlaceInput,
  type PlaceSearchBias,
} from "../place/add-place-input";
import {
  AddEvStationButton,
  type EvStationSearchAnchor,
} from "../charger/add-ev-station-button";
import {
  activeBlockIdAtom,
  addChecklistToBlockAtom,
  addNoteToBlockAtom,
  tripDateRangeAtom,
  updateBlockDateAtom,
  updateBlockTitleAtom,
} from "../overview/trip-builder.atoms";
import { BlockDatePicker } from "./block-date-picker";
import { BlockOptionsPopover } from "./block-options-popover";
import { SortableBlockItems } from "./sortable-block-items";

type TripBlockContextValue = {
  block: TripBlockData;
};

const TripBlockContext = createContext<TripBlockContextValue | null>(null);

function useTripBlockContext() {
  const context = useContext(TripBlockContext);

  if (!context) {
    throw new Error(
      "TripBlock compound components must be rendered inside TripBlock.Root.",
    );
  }

  return context;
}

type TripBlockRootProps = {
  block: TripBlockData;
  children: ReactNode;
  className?: string;
};

function TripBlockRoot({ block, children, className }: TripBlockRootProps) {
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const blockColor = getTripBlockColorById(block.colorId);
  const blockStyle: CSSProperties & Record<`--${string}`, string> = {
    "--primary": blockColor.value,
    "--primary-foreground": blockColor.foreground,
    "--ring": blockColor.value,
  };

  const contextValue = useMemo<TripBlockContextValue>(
    () => ({ block }),
    [block],
  );

  return (
    <TripBlockContext.Provider value={contextValue}>
      <div
        id={`trip-block-${block.id}`}
        className={cn("flex w-full scroll-mt-4 flex-col", className)}
        style={blockStyle}
        onFocus={() => setActiveBlockId(block.id)}
        onClick={() => setActiveBlockId(block.id)}
      >
        {children}
      </div>
    </TripBlockContext.Provider>
  );
}

function TripBlockHeader({ children }: { children: ReactNode }) {
  return <div className="mx-0 mb-4 space-y-3">{children}</div>;
}

function TripBlockTitle() {
  const { block } = useTripBlockContext();
  const tripDateRange = useAtomValue(tripDateRangeAtom);
  const updateBlockDate = useSetAtom(updateBlockDateAtom);
  const updateBlockTitle = useSetAtom(updateBlockTitleAtom);
  const blockColor = getTripBlockColorById(block.colorId);
  const isListBlock = block.kind === "list";
  const listTitle = block.title.trim();
  const [isEditingListTitle, setIsEditingListTitle] = useState(
    listTitle.length === 0,
  );
  const shouldShowListEditor =
    isListBlock && (isEditingListTitle || listTitle.length === 0);

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        {shouldShowListEditor ? (
          <Textarea
            value={block.title}
            rows={1}
            autoFocus
            aria-label="List title"
            placeholder='Add a title (e.g. "Restaurants")'
            onBlur={() => {
              if (block.title.trim()) {
                setIsEditingListTitle(false);
              }
            }}
            onChange={(event) =>
              updateBlockTitle({
                blockId: block.id,
                title: event.target.value,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (block.title.trim()) {
                  setIsEditingListTitle(false);
                }
              }
            }}
            className="min-h-12 resize-none rounded-sm border-transparent bg-muted/50 px-3 py-2 text-xl font-bold leading-tight text-foreground shadow-none placeholder:text-muted-foreground hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        ) : isListBlock ? (
          <button
            type="button"
            aria-label={`Edit list title: ${listTitle}`}
            className="min-h-12 w-full rounded-sm bg-muted/50 px-3 py-2 text-left text-xl font-bold leading-tight text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            onClick={(event) => {
              event.stopPropagation();
              setIsEditingListTitle(true);
            }}
          >
            <span className="line-clamp-2">{listTitle}</span>
          </button>
        ) : (
          <BlockDatePicker
            date={block.date}
            from={tripDateRange.from}
            to={tripDateRange.to}
            onDateChange={(date) =>
              updateBlockDate({ blockId: block.id, date })
            }
          />
        )}
      </div>
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: blockColor.value }}
        aria-hidden="true"
      />
      <BlockOptionsPopover block={block} />
    </div>
  );
}

function TripBlockContent({ children }: { children: ReactNode }) {
  return <div className="pb-0">{children}</div>;
}

function TripBlockActions({
  evSearchAnchor,
  placeSearchBias,
}: {
  evSearchAnchor?: EvStationSearchAnchor;
  placeSearchBias?: PlaceSearchBias;
}) {
  const { block } = useTripBlockContext();
  const addNoteToBlock = useSetAtom(addNoteToBlockAtom);
  const addChecklistToBlock = useSetAtom(addChecklistToBlockAtom);

  return (
    <div className="mx-0 mt-5 space-y-3">
      <AddPlaceInput blockId={block.id} searchBias={placeSearchBias} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2 [&_button]:h-auto [&_button]:min-h-11 [&_button]:whitespace-normal [&_button]:px-2 [&_button]:py-2 [&_button]:leading-snug">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 min-w-0 w-full rounded-lg border-note/30 bg-note/10 text-note hover:bg-note/20 hover:text-note"
          onClick={() => addNoteToBlock({ blockId: block.id })}
        >
          <FileText className="size-4" aria-hidden="true" />
          Add a note
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 min-w-0 w-full rounded-lg border-checklist/30 bg-checklist/10 text-checklist hover:bg-checklist/20 hover:text-checklist"
          onClick={() => addChecklistToBlock({ blockId: block.id })}
        >
          <CheckSquare className="size-4" aria-hidden="true" />
          Add checklist
        </Button>
        <AddEvStationButton
          blockId={block.id}
          fallbackAnchor={evSearchAnchor}
        />
      </div>
    </div>
  );
}

function TripBlockPlaceActions({
  placeSearchBias,
}: {
  placeSearchBias?: PlaceSearchBias;
}) {
  const { block } = useTripBlockContext();

  return (
    <div className="mx-0 mt-4">
      <AddPlaceInput blockId={block.id} searchBias={placeSearchBias} />
    </div>
  );
}

function TripBlockItems({ hasStart = false }: { hasStart?: boolean }) {
  const { block } = useTripBlockContext();

  return <SortableBlockItems block={block} hasStart={hasStart} />;
}

export const TripBlock = Object.assign(TripBlockRoot, {
  Root: TripBlockRoot,
  Header: TripBlockHeader,
  Title: TripBlockTitle,
  Content: TripBlockContent,
  Actions: TripBlockActions,
  PlaceActions: TripBlockPlaceActions,
  Items: TripBlockItems,
});
