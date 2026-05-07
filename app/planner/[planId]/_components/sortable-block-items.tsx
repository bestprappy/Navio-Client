"use client";

import { type DragEvent, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { TripBlockData, TripBlockItem } from "./data";
import { reorderBlockItemsAtom } from "./trip-builder.atoms";
import { TripChecklistItem } from "./trip-checklist-item";
import { TripNoteItem } from "./trip-note-item";
import { TripPlaceCard } from "./trip-place-card";

type SortableBlockItemsProps = {
  block: TripBlockData;
};

type DragPayload = {
  blockId: string;
  itemId: string;
};

const DRAG_BLOCK_TYPE = "application/x-navio-trip-block";
const DRAG_ITEM_TYPE = "application/x-navio-trip-item";

function renderBlockItem(
  blockId: string,
  item: TripBlockItem,
  position: number,
) {
  switch (item.type) {
    case "place":
      return (
        <TripPlaceCard blockId={blockId} item={item} position={position} />
      );
    case "note":
      return <TripNoteItem blockId={blockId} item={item} />;
    case "checklist":
      return <TripChecklistItem blockId={blockId} item={item} />;
  }
}

export function SortableBlockItems({ block }: SortableBlockItemsProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const reorderBlockItems = useSetAtom(reorderBlockItemsAtom);

  function reorderByOffset(itemId: string, offset: number) {
    const itemIndex = block.items.findIndex((item) => item.id === itemId);
    const overItem = block.items[itemIndex + offset];

    if (!overItem) {
      return;
    }

    reorderBlockItems({
      blockId: block.id,
      activeItemId: itemId,
      overItemId: overItem.id,
    });
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, itemId: string) {
    const payload: DragPayload = {
      blockId: block.id,
      itemId,
    };

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_BLOCK_TYPE, payload.blockId);
    event.dataTransfer.setData(DRAG_ITEM_TYPE, payload.itemId);
    setDraggedItemId(itemId);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, overItemId: string) {
    event.preventDefault();
    const sourceBlockId = event.dataTransfer.getData(DRAG_BLOCK_TYPE);
    const sourceItemId = event.dataTransfer.getData(DRAG_ITEM_TYPE);

    setDraggedItemId(null);
    setDropTargetId(null);

    if (!sourceBlockId || !sourceItemId || sourceBlockId !== block.id) {
      return;
    }

    reorderBlockItems({
      blockId: block.id,
      activeItemId: sourceItemId,
      overItemId,
    });
  }

  return (
    <div role="list" className="space-y-3" aria-label={`${block.title} items`}>
      {block.items.map((item, index) => {
        const isDragging = draggedItemId === item.id;
        const isDropTarget =
          dropTargetId === item.id && draggedItemId !== item.id;

        return (
          <div
            key={item.id}
            role="listitem"
            draggable
            onDragStart={(event) => handleDragStart(event, item.id)}
            onDragEnd={() => {
              setDraggedItemId(null);
              setDropTargetId(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTargetId(item.id);
            }}
            onDragLeave={() => setDropTargetId(null)}
            onDrop={(event) => handleDrop(event, item.id)}
            className={cn(
              " mr-8  grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-sm transition-colors",
              isDragging && "opacity-50",
              isDropTarget && "bg-primary/10 p-2",
            )}
          >
            <div className="flex flex-col items-center gap-1 ml-3">
              <button
                type="button"
                className="flex size-8 cursor-grab items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 active:cursor-grabbing"
                aria-label="Drag item"
              >
                <GripVertical className="size-4" aria-hidden="true" />
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move item up"
                disabled={index === 0}
                onClick={() => reorderByOffset(item.id, -1)}
              >
                <ChevronUp className="size-3" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move item down"
                disabled={index === block.items.length - 1}
                onClick={() => reorderByOffset(item.id, 1)}
              >
                <ChevronDown className="size-3" aria-hidden="true" />
              </Button>
            </div>

            {renderBlockItem(block.id, item, index + 1)}
          </div>
        );
      })}
    </div>
  );
}
