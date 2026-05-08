"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import { CheckSquare, FileText } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { TripBlockData } from "../constants/types";
import { getTripBlockColorById } from "../constants/trip-block-colors";
import { AddPlaceInput } from "../place/add-place-input";
import { PremadeListPicker } from "../premade/premade-list-picker";
import {
  activeBlockIdAtom,
  addChecklistToBlockAtom,
  addNoteToBlockAtom,
  openBlockIdsAtom,
  toggleBlockOpenAtom,
  updateBlockTitleAtom,
} from "../overview/trip-builder.atoms";
import { BlockOptionsPopover } from "./block-options-popover";
import { BlockTitle } from "./block-title";
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
  const openIds = useAtomValue(openBlockIdsAtom);
  const toggleBlockOpen = useSetAtom(toggleBlockOpenAtom);
  const isOpen = openIds.includes(block.id);

  const contextValue = useMemo<TripBlockContextValue>(
    () => ({ block }),
    [block],
  );

  return (
    <TripBlockContext.Provider value={contextValue}>
      <Accordion
        value={isOpen ? [block.id] : []}
        onValueChange={() => toggleBlockOpen(block.id)}
        className={cn("", className)}
      >
        <AccordionItem
          value={block.id}
          className="border-none"
          onFocusCapture={() => setActiveBlockId(block.id)}
          onClick={() => setActiveBlockId(block.id)}
        >
          {children}
        </AccordionItem>
      </Accordion>
    </TripBlockContext.Provider>
  );
}

function TripBlockHeader({ children }: { children: ReactNode }) {
  return <div className="mx-3 mb-4 space-y-3">{children}</div>;
}

function TripBlockTitle() {
  const { block } = useTripBlockContext();
  const updateBlockTitle = useSetAtom(updateBlockTitleAtom);
  const blockColor = getTripBlockColorById(block.colorId);

  return (
    <div className="flex items-center gap-2 mr-6">
      <div className="min-w-0 flex-1 ">
        <AccordionTrigger
          iconSide="left"
          className="py-0 text-2xl font-bold text-foreground hover:text-foreground hover:no-underline"
        >
          <BlockTitle
            value={block.title}
            onChange={(title) => updateBlockTitle({ blockId: block.id, title })}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </AccordionTrigger>
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
  return <AccordionContent className="pb-0">{children}</AccordionContent>;
}

function TripBlockActions() {
  const { block } = useTripBlockContext();
  const addNoteToBlock = useSetAtom(addNoteToBlockAtom);
  const addChecklistToBlock = useSetAtom(addChecklistToBlockAtom);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 mx-8 pl-2 ">
      <AddPlaceInput blockId={block.id} />
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="rounded-sm py-6"
        onClick={() => addNoteToBlock({ blockId: block.id })}
      >
        <FileText className="size-4" aria-hidden="true" />
        Add notes
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="rounded-sm py-6"
        onClick={() => addChecklistToBlock({ blockId: block.id })}
      >
        <CheckSquare className="size-4" aria-hidden="true" />
        Add checklist
      </Button>
      <PremadeListPicker blockId={block.id} />
    </div>
  );
}

function TripBlockItems() {
  const { block } = useTripBlockContext();

  return <SortableBlockItems block={block} />;
}

export const TripBlock = Object.assign(TripBlockRoot, {
  Root: TripBlockRoot,
  Header: TripBlockHeader,
  Title: TripBlockTitle,
  Content: TripBlockContent,
  Actions: TripBlockActions,
  Items: TripBlockItems,
});
