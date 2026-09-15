"use client";

import { Fragment, type DragEvent, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import {
  type TripBlockData,
  type TripBlockItem,
} from "../constants/types";
import { useTripCharging } from "../garage/use-trip-charging";
import { getDayPlacePositions, getLastDayPlaceId } from "../itinerary/day-anchors";
import { getTripItemElementId } from "../itinerary/use-reveal-plan-card";
import { reorderBlockItemsAtom } from "../overview/trip-builder.atoms";
import { DischargeSegmentInfo } from "../routes/charge-segment-info";
import { RouteSegmentInfo } from "../routes/route-segment-info";
import { getRouteSegmentByToItemId } from "../routes/trip-route.helpers";
import { useTripRoutes } from "../routes/trip-route-query";
import { TripChecklistItem } from "./items/trip-checklist-item";
import { TripNoteItem } from "./items/trip-note-item";
import { TripPlaceCard } from "./items/trip-place-card";

type SortableBlockItemsProps = {
  block: TripBlockData;
  hasStart?: boolean;
};

type DragPayload = {
  blockId: string;
  itemId: string;
};

type BatteryState = {
  arrivalPct: number;
  departurePct: number;
};

const DRAG_BLOCK_TYPE = "application/x-navio-trip-block";
const DRAG_ITEM_TYPE = "application/x-navio-trip-item";

function renderBlockItem(
  block: TripBlockData,
  item: TripBlockItem,
  placePosition: number | null,
  showEvChargeDetails: boolean,
  canMarkAsEnd: boolean,
  chargeBatteryFrom?: number,
  chargeBatteryTo?: number,
) {
  switch (item.type) {
    case "place":
      return (
        <TripPlaceCard
          blockId={block.id}
          blockColorId={block.colorId}
          blockDate={block.date}
          item={item}
          position={placePosition}
          chargeBatteryFrom={chargeBatteryFrom}
          chargeBatteryTo={chargeBatteryTo}
          showEvChargeDetails={showEvChargeDetails}
          canMarkAsEnd={canMarkAsEnd}
        />
      );
    case "note":
      return <TripNoteItem blockId={block.id} item={item} />;
    case "checklist":
      return <TripChecklistItem blockId={block.id} item={item} />;
  }
}

export function SortableBlockItems({ block, hasStart = false }: SortableBlockItemsProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [interactiveItemId, setInteractiveItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const shouldShowRouting = block.kind !== "list";
  const reorderBlockItems = useSetAtom(reorderBlockItemsAtom);
  const charging = useTripCharging();
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
  const batteryStateByItemId = charging?.days.get(block.id)?.batteryByItemId ?? new Map<string, BatteryState>();

  const blockColor = getTripBlockColorById(block.colorId);
  const placePositions = getDayPlacePositions(block, hasStart);
  const lastDayPlaceId = getLastDayPlaceId(block);

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
        const placePosition = placePositions.get(item.id) ?? null;
        const isDragging = draggedItemId === item.id;
        const isDropTarget =
          dropTargetId === item.id && draggedItemId !== item.id;
        const isRouteableItem = item.type === "place";
        const routeablePosition = isRouteableItem
          ? (routeablePositionByItemId.get(item.id) ?? 0)
          : 0;
        const shouldShowRouteInfo =
          shouldShowRouting && isRouteableItem && (hasStart || routeablePosition > 1);

        const seg = shouldShowRouteInfo
          ? routeSegmentByToItemId.get(item.id)
          : undefined;
        const fromState = seg
          ? batteryStateByItemId.get(seg.fromItemId)
          : undefined;
        const toState = shouldShowRouteInfo
          ? batteryStateByItemId.get(item.id)
          : undefined;
        const itemBatteryState = batteryStateByItemId.get(item.id);

        return (
          <Fragment key={item.id}>
            {shouldShowRouteInfo ? (
              <div
                role="listitem"
                className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 rounded-sm"
              >
                <div
                  className="flex justify-center py-1"
                  aria-hidden="true"
                >
                  <span className="h-full min-h-8 w-px bg-border" />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 py-1">
                  <RouteSegmentInfo
                    segment={seg ?? null}
                    isLoading={tripRoutes.isFetching && !tripRoutes.data}
                    isError={tripRoutes.isError}
                    routeColor={blockColor.value}
                  />
                  <DischargeSegmentInfo
                    batteryFrom={fromState?.departurePct}
                    batteryTo={toState?.arrivalPct}
                  />
                </div>
              </div>
            ) : null}

            <div
              id={getTripItemElementId(item.id)}
              role="listitem"
              draggable={interactiveItemId !== item.id}
              onPointerDownCapture={(event) => {
                const target = event.target as HTMLElement;
                setInteractiveItemId(target.closest("input, textarea, select, a, [data-no-drag]") ? item.id : null);
              }}
              onPointerUpCapture={() => setInteractiveItemId(null)}
              onPointerCancel={() => setInteractiveItemId(null)}
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
                "min-w-0 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 rounded-sm transition-colors",
                isDragging && "opacity-50",
                isDropTarget && "bg-primary/10 p-2",
              )}
            >
              <div className="flex flex-col items-center gap-1">
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

              {renderBlockItem(
                block,
                item,
                placePosition,
                shouldShowRouting,
                item.id === lastDayPlaceId,
                itemBatteryState?.arrivalPct,
                itemBatteryState?.departurePct,
              )}
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
