"use client";

import { Fragment, type DragEvent, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import {
  isEvChargerPlaceItem,
  type TripBlockData,
  type TripBlockItem,
} from "../constants/types";
import { reorderBlockItemsAtom } from "../overview/trip-builder.atoms";
import { RouteSegmentInfo } from "../routes/route-segment-info";
import { getRouteSegmentByToItemId } from "../routes/trip-route.helpers";
import { useTripRoutes } from "../routes/trip-route-query";
import { TripChecklistItem } from "./items/trip-checklist-item";
import { TripNoteItem } from "./items/trip-note-item";
import { TripPlaceCard } from "./items/trip-place-card";

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
  block: TripBlockData,
  item: TripBlockItem,
  placePosition: number | null,
) {
  switch (item.type) {
    case "place":
      return (
        <TripPlaceCard
          blockId={block.id}
          blockColorId={block.colorId}
          item={item}
          position={placePosition}
        />
      );
    case "note":
      return <TripNoteItem blockId={block.id} item={item} />;
    case "checklist":
      return <TripChecklistItem blockId={block.id} item={item} />;
  }
}

function getRegularPlacePosition(
  items: TripBlockItem[],
  currentIndex: number,
): number | null {
  const currentItem = items[currentIndex];

  if (
    !currentItem ||
    currentItem.type !== "place" ||
    isEvChargerPlaceItem(currentItem)
  ) {
    return null;
  }

  return items
    .slice(0, currentIndex + 1)
    .filter((item) => item.type === "place" && !isEvChargerPlaceItem(item))
    .length;
}

export function SortableBlockItems({ block }: SortableBlockItemsProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const reorderBlockItems = useSetAtom(reorderBlockItemsAtom);
  const tripRoutes = useTripRoutes();
  const routeSegments = useMemo(
    () => tripRoutes.data?.segments ?? [],
    [tripRoutes.data?.segments],
  );
  const routeSegmentByToItemId = useMemo(
    () =>
      getRouteSegmentByToItemId(
        routeSegments.filter((segment) => segment.blockId === block.id),
      ),
    [block.id, routeSegments],
  );
  const routeablePositionByItemId = useMemo(
    () => getRouteablePositionByItemId(block.items),
    [block.items],
  );
  const blockColor = getTripBlockColorById(block.colorId);

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
        const placePosition = getRegularPlacePosition(block.items, index);
        const isDragging = draggedItemId === item.id;
        const isDropTarget =
          dropTargetId === item.id && draggedItemId !== item.id;
        const isRouteableItem = item.type === "place";
        const routeablePosition = isRouteableItem
          ? (routeablePositionByItemId.get(item.id) ?? 0)
          : 0;
        const shouldShowRouteInfo = isRouteableItem && routeablePosition > 1;

        return (
          <Fragment key={item.id}>
            {shouldShowRouteInfo ? (
              <div
                role="listitem"
                className="mr-8 grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-sm"
              >
                <div
                  className="ml-3 flex justify-center py-1"
                  aria-hidden="true"
                >
                  <span className="h-full min-h-8 w-px bg-border" />
                </div>
                <RouteSegmentInfo
                  segment={routeSegmentByToItemId.get(item.id) ?? null}
                  isLoading={tripRoutes.isFetching && !tripRoutes.data}
                  isError={tripRoutes.isError}
                  routeColor={blockColor.value}
                />
              </div>
            ) : null}

            <div
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

              {renderBlockItem(block, item, placePosition)}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function getRouteablePositionByItemId(
  items: TripBlockItem[],
): Map<string, number> {
  const positions = new Map<string, number>();
  let routeablePosition = 0;

  items.forEach((item) => {
    if (item.type !== "place") {
      return;
    }

    routeablePosition += 1;
    positions.set(item.id, routeablePosition);
  });

  return positions;
}
