"use client";

import { Fragment, type DragEvent, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import {
  isPlaceItem,
  type PlaceItem,
  type TripBlockData,
  type TripBlockItem,
} from "../constants/types";
import { useTripCharging } from "../garage/use-trip-charging";
import { getDayPlacePositions, getLastDayPlaceId } from "../itinerary/day-anchors";
import { routeStopAttributes } from "../itinerary/route-stop-tracker";
import { useDaySchedule } from "../itinerary/use-day-schedule";
import { getTripItemElementId } from "../itinerary/use-reveal-plan-card";
import { closeActiveSearchAtom, plannerReadOnlyAtom, reorderBlockItemsAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";
import { type PlaceSearchBias } from "../place/add-place-input";
import { InsertItemRow } from "./insert-item-row";
import { getItemInsertionLabel } from "./item-insertion";
import { useEvStationSearch } from "../charger/add-ev-station-button";
import { DischargeSegmentInfo } from "../routes/charge-segment-info";
import { FocusRouteLegButton } from "../routes/focus-route-leg-button";
import { resolveLegTravelMode } from "../routes/leg-travel-mode";
import { RouteSegmentInfo } from "../routes/route-segment-info";
import { RouteJourneyOptions } from "../routes/route-journey-options";
import { getRouteSegmentByToItemId, getTripRouteGroups } from "../routes/trip-route.helpers";
import { useTripRoutes } from "../routes/trip-route-query";
import { TripChecklistItem } from "./items/trip-checklist-item";
import { TripNoteItem } from "./items/trip-note-item";
import { TripPlaceCard } from "./items/trip-place-card";

type SortableBlockItemsProps = {
  block: TripBlockData;
  hasStart?: boolean;
  placeSearchBias?: PlaceSearchBias;
};

type DragPayload = {
  blockId: string;
  itemId: string;
};

type BatteryState = {
  observedSocPct?: number | null;
  arrivalPct: number | null;
  departurePct: number | null;
};

const DRAG_BLOCK_TYPE = "application/x-navio-trip-block";
const DRAG_ITEM_TYPE = "application/x-navio-trip-item";

function renderBlockItem(
  block: TripBlockData,
  item: TripBlockItem,
  placePosition: number | null,
  showEvChargeDetails: boolean,
  canMarkAsEnd: boolean,
  chargeBatteryFrom?: number | null,
  chargeBatteryTo?: number | null,
  lateMinutes?: number | null,
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
          lateMinutes={lateMinutes}
        />
      );
    case "note":
      return <TripNoteItem blockId={block.id} item={item} />;
    case "checklist":
      return <TripChecklistItem blockId={block.id} item={item} />;
  }
}

export function SortableBlockItems({ block, hasStart = false, placeSearchBias }: SortableBlockItemsProps) {
  const [activeInsertionId, setActiveInsertionId] = useState<string | null>(null);
  const closeActiveSearch = useSetAtom(closeActiveSearchAtom);
  const evStationSearch = useEvStationSearch({
    blockId: block.id,
    fallbackAnchor: placeSearchBias ? { id: `destination-${block.id}`, lat: placeSearchBias.lat, lng: placeSearchBias.lng } : undefined,
  });
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [interactiveItemId, setInteractiveItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const shouldShowRouting = block.kind !== "list";
  const reorderBlockItems = useSetAtom(reorderBlockItemsAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const charging = useTripCharging();
  const tripRoutes = useTripRoutes();
  const tripBlocks = useAtomValue(tripBlocksAtom);
  const routePoints = useMemo(() => getTripRouteGroups(tripBlocks).find((group) => group.blockId === block.id)?.points ?? [], [block.id, tripBlocks]);
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
  const previousPlaceByItemId = useMemo(
    () => getPreviousPlaceByItemId(block.items),
    [block.items],
  );
  const batteryStateByItemId = charging?.days.get(block.id)?.batteryByItemId ?? new Map<string, BatteryState>();
  const daySchedule = useDaySchedule(block, hasStart);

  const blockColor = getTripBlockColorById(block.colorId);
  const placePositions = getDayPlacePositions(block, hasStart);
  const lastDayPlaceId = getLastDayPlaceId(block);

  function insertionControl(controlId: string, beforeItemId?: string, afterItemId?: string) {
    return (
      <InsertItemRow
        blockId={block.id}
        beforeItemId={beforeItemId}
        afterItemId={afterItemId}
        label={getItemInsertionLabel(block, beforeItemId, hasStart) ?? "Add an item"}
        searchBias={placeSearchBias}
        canAddEvStation={evStationSearch.canSearch && !evStationSearch.isLoadingEvChargers}
        onAddEvStation={() => void evStationSearch.openStationList(beforeItemId)}
        open={activeInsertionId === controlId}
        onOpenChange={(isOpen) => {
          if (isOpen) closeActiveSearch();
          setActiveInsertionId(isOpen ? controlId : null);
        }}
      />
    );
  }

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
        // The first stop after the day's start anchor leaves from the anchor, which is never a station.
        const legFrom = previousPlaceByItemId.get(item.id);
        const legMode = isPlaceItem(item) ? resolveLegTravelMode(legFrom, item) : "drive";
        const pointIndex = routePoints.findIndex((point) => point.id === item.id);
        const fromPoint = routePoints[pointIndex - 1];
        const toPoint = routePoints[pointIndex];

        return (
          <Fragment key={item.id}>
            {shouldShowRouteInfo ? (
              <div
                role="listitem"
                {...routeStopAttributes(item.id)}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 rounded-sm"
              >
                <div
                  className="flex justify-center py-1"
                  aria-hidden="true"
                >
                  <span className="h-full min-h-8 w-px bg-border" />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1.5 py-1">
                  {fromPoint && toPoint ? (
                    <RouteJourneyOptions
                      key={`${fromPoint.id}>${toPoint.id}`}
                      blockId={block.id}
                      from={fromPoint}
                      to={toPoint}
                      segment={seg ?? null}
                      plannedMode={legMode}
                      automaticRail={isPlaceItem(item) && !item.arrivalMode && Boolean(toPoint.railOnly)}
                      routeColor={blockColor.value}
                      isLoading={tripRoutes.isFetching && !tripRoutes.data}
                      isError={tripRoutes.isError}
                      trailing={<>
                        {legMode === "drive" ? <DischargeSegmentInfo batteryFrom={fromState?.departurePct} batteryTo={toState?.arrivalPct} /> : null}
                        {seg ? <FocusRouteLegButton blockId={block.id} stopId={item.id} toName={seg.toName} className="ml-auto" /> : null}
                      </>}
                    />
                  ) : <RouteSegmentInfo segment={seg ?? null} isLoading={tripRoutes.isFetching && !tripRoutes.data} isError={tripRoutes.isError} routeColor={blockColor.value} plannedMode={legMode} />}
                </div>
              </div>
            ) : null}

            <div
              id={getTripItemElementId(item.id)}
              role="listitem"
              {...(shouldShowRouting && isRouteableItem ? routeStopAttributes(item.id) : {})}
              draggable={!readOnly && interactiveItemId !== item.id}
              onPointerDownCapture={(event) => {
                const target = event.target as HTMLElement;
                setInteractiveItemId(target.closest("input, textarea, select, a, [data-no-drag]") ? item.id : null);
              }}
              onPointerUpCapture={() => setInteractiveItemId(null)}
              onPointerCancel={() => setInteractiveItemId(null)}
              onDragStart={readOnly ? undefined : (event) => handleDragStart(event, item.id)}
              onDragEnd={() => {
                setDraggedItemId(null);
                setDropTargetId(null);
              }}
              onDragOver={readOnly ? undefined : (event) => {
                event.preventDefault();
                setDropTargetId(item.id);
              }}
              onDragLeave={readOnly ? undefined : () => setDropTargetId(null)}
              onDrop={readOnly ? undefined : (event) => handleDrop(event, item.id)}
              className={cn(
                "min-w-0 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 rounded-sm transition-colors",
                isDragging && "opacity-50",
                isDropTarget && "bg-primary/10 p-2",
              )}
            >
              {readOnly ? (
                // The gutter stays so stops line up with the route connectors.
                <div className="flex justify-center pt-3" aria-hidden="true">
                  <span className="size-2 rounded-full" style={{ backgroundColor: blockColor.value }} />
                </div>
              ) : <div className="flex flex-col items-center gap-1">
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
              </div>}

              <div className="group/plan-card min-w-0">
                {!readOnly && index === 0 && insertionControl(`before-${item.id}`, item.id)}
                {renderBlockItem(
                  block,
                  item,
                  placePosition,
                  shouldShowRouting,
                  item.id === lastDayPlaceId,
                  itemBatteryState?.observedSocPct ?? itemBatteryState?.arrivalPct,
                  itemBatteryState?.departurePct,
                  shouldShowRouting ? daySchedule.lateByItemId.get(item.id)?.minutes : null,
                )}
                {!readOnly && insertionControl(`after-${item.id}`, block.items[index + 1]?.id, item.id)}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

/** The place each stop's leg starts from; absent for the day's first place. */
function getPreviousPlaceByItemId(items: TripBlockItem[]): Map<string, PlaceItem> {
  const previous = new Map<string, PlaceItem>();
  let last: PlaceItem | undefined;

  items.forEach((item) => {
    if (!isPlaceItem(item)) return;
    if (last) previous.set(item.id, last);
    last = item;
  });

  return previous;
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
