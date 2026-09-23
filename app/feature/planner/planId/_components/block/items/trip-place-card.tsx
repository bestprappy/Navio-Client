"use client";

import type { CSSProperties } from "react";
import {
  CheckCircle2,
  Clock,
  Flag,
  LockKeyhole,
  LockKeyholeOpen,
  MapPin,
  Trash2,
  Zap,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../../constants/trip-block-colors";
import {
  isEvChargerPlaceItem,
  type PlaceItem,
  type TripBlockColorId,
} from "../../constants/types";
import {
  markPlaceAsDayEndAtom,
  removeItemFromBlockAtom,
  selectedTripPlaceItemIdReadonlyAtom,
  selectTripPlaceAtom,
  tripCurrencyAtom,
  updatePlaceItemAtom,
} from "../../overview/trip-builder.atoms";
import { StationChargingControl } from "../../charger/station-charging-control";
import { StationSpecifications } from "../../charger/station-specifications";
import { ChargeSegmentInfo } from "../../routes/charge-segment-info";
import { PlaceCardVisual } from "./place-card-visual";
import { PlaceCostPopover } from "./place-cost-popover";
import { PlaceTimePopover } from "./place-time-popover";
import { ObservedSocControl } from "./observed-soc-control";

type TripPlaceCardProps = {
  blockId: string;
  blockColorId: TripBlockColorId;
  blockDate: string;
  item: PlaceItem;
  position: number | null;
  chargeBatteryFrom?: number | null;
  chargeBatteryTo?: number | null;
  showEvChargeDetails?: boolean;
  /** Only the day's last stop can become where the day ends. */
  canMarkAsEnd?: boolean;
};

function formatDisplayTime(time: string): string {
  const [hourStr, minuteStr = "00"] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

export function TripPlaceCard({
  blockId,
  blockColorId,
  blockDate,
  item,
  position,
  chargeBatteryFrom,
  chargeBatteryTo,
  canMarkAsEnd = false,
}: TripPlaceCardProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
  const markPlaceAsDayEnd = useSetAtom(markPlaceAsDayEndAtom);
  const selectTripPlace = useSetAtom(selectTripPlaceAtom);
  const selectedTripPlaceItemId = useAtomValue(
    selectedTripPlaceItemIdReadonlyAtom,
  );
  const currency = useAtomValue(tripCurrencyAtom);
  const isSelected = selectedTripPlaceItemId === item.id;
  const isEvCharger = isEvChargerPlaceItem(item);
  const blockColor = getTripBlockColorById(blockColorId);
  const markerStyle: CSSProperties = {
    backgroundColor: blockColor.value,
    color: blockColor.foreground,
  };
  // --surface-ring stacks the selection ring on top of the card's elevation shadow.
  const selectedStyle: CSSProperties | undefined = isSelected
    ? ({
        borderColor: blockColor.value,
        "--surface-ring": `0 0 0 2px color-mix(in oklch, ${blockColor.value} 28%, transparent)`,
      } as CSSProperties)
    : undefined;
  const chargerDetails = item.evCharger;

  return (
    <article
      className={cn(
        "surface-card min-w-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card dark:border-border/70",
        isSelected && "border-2",
      )}
      style={selectedStyle}
      onClick={() => selectTripPlace({ itemId: item.id })}
    >
      {isEvCharger ? (
        /* ── EV charger branch ── */
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div
              role="img"
              aria-label="EV charging station"
              className="surface-tile flex size-9 shrink-0 items-center justify-center rounded-md"
              style={markerStyle}
            >
              <Zap className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base leading-snug font-semibold wrap-break-word text-foreground">
                {item.name}
              </h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                <span>Charging stop</span>
                {chargerDetails?.operatorName ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{chargerDetails.operatorName}</span>
                  </>
                ) : null}
                {chargerDetails?.locked ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <LockKeyhole className="size-3.5" aria-hidden="true" />
                      Kept when optimizing
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <StationSpecifications item={item} />

          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{item.address}</span>
          </p>

          {chargerDetails && (
            <div className="border-t border-border pt-4">
              <StationChargingControl blockId={blockId} itemId={item.id} stationName={item.name} details={chargerDetails} arrivalPct={chargeBatteryFrom} />
            </div>
          )}

          {isSelected ? (
            <>
              <textarea
                value={item.notes ?? ""}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  updatePlaceItem({
                    blockId,
                    itemId: item.id,
                    updates: { notes: event.target.value },
                  })
                }
                placeholder="Add charging notes, bay number, receipt, etc."
                aria-label={`Notes for ${item.name}`}
                rows={3}
                className="min-h-20 w-full resize-y rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {/* The charging control above already shows arrival and target. */}
              {!chargerDetails && (
                <ChargeSegmentInfo
                  batteryFrom={chargeBatteryFrom}
                  batteryTo={chargeBatteryTo}
                />
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={item.isVisited ? "secondary" : "default"}
                    size="sm"
                    className="rounded-sm p-4"
                    onClick={(event) => {
                      event.stopPropagation();
                      updatePlaceItem({
                        blockId,
                        itemId: item.id,
                        updates: { isVisited: !item.isVisited },
                      });
                    }}
                  >
                    {item.isVisited ? (
                      <>
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Charging completed
                      </>
                    ) : (
                      <>
                        <Zap className="size-3.5" aria-hidden="true" />
                        Mark as charged
                      </>
                    )}
                  </Button>
                  {chargerDetails ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-sm"
                      title={
                        chargerDetails.locked
                          ? "Allow the optimizer to replace this charger"
                          : "Keep this charger during route optimization"
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        updatePlaceItem({
                          blockId,
                          itemId: item.id,
                          updates: {
                            evCharger: {
                              ...chargerDetails,
                              locked: !chargerDetails.locked,
                            },
                          },
                        });
                      }}
                    >
                      {chargerDetails.locked ? (
                        <LockKeyhole className="size-3.5" aria-hidden="true" />
                      ) : (
                        <LockKeyholeOpen
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      )}
                      {chargerDetails.locked ? "Unlock stop" : "Keep stop"}
                    </Button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete ${item.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItemFromBlock({ blockId, itemId: item.id });
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {!chargerDetails && (
                <ChargeSegmentInfo
                  batteryFrom={chargeBatteryFrom}
                  batteryTo={chargeBatteryTo}
                />
              )}
              {item.isVisited && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Charging completed
                </span>
              )}
              {item.notes && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {item.notes}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── Regular place branch — uses shared PlaceCardVisual ── */
        <>
          <PlaceCardVisual
            name={item.name}
            imageUrl={item.imageUrl}
            rating={item.rating}
            reviewCount={item.reviewCount}
            address={item.address}
            description={item.description}
            position={position}
            colorId={blockColorId}
          />

          {isSelected ? (
            <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-3">
              <textarea
                value={item.notes ?? ""}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  updatePlaceItem({
                    blockId,
                    itemId: item.id,
                    updates: { notes: event.target.value },
                  })
                }
                placeholder="Add notes, links, etc. here"
                aria-label={`Notes for ${item.name}`}
                rows={3}
                className="min-h-20 w-full resize-y rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={item.isVisited ? "secondary" : "outline"}
                    size="sm"
                    className="rounded-sm p-4"
                    onClick={(event) => {
                      event.stopPropagation();
                      updatePlaceItem({
                        blockId,
                        itemId: item.id,
                        updates: { isVisited: !item.isVisited },
                      });
                    }}
                  >
                    {item.isVisited ? (
                      <>
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Visited
                      </>
                    ) : (
                      "Mark as visited"
                    )}
                  </Button>
                  <PlaceTimePopover
                    blockId={blockId}
                    itemId={item.id}
                    time={item.time}
                    timeEnd={item.timeEnd}
                  />
                  <PlaceCostPopover
                    blockId={blockId}
                    itemId={item.id}
                    itemName={item.name}
                    blockDate={blockDate}
                    cost={item.cost}
                  />
                  {canMarkAsEnd ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-sm"
                      title="Make this the place the day ends at"
                      onClick={(event) => {
                        event.stopPropagation();
                        markPlaceAsDayEnd({ blockId, itemId: item.id });
                      }}
                    >
                      <Flag className="size-3.5" aria-hidden="true" />
                      Mark as end stop
                    </Button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete ${item.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItemFromBlock({ blockId, itemId: item.id });
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {(item.isVisited ||
                item.time ||
                item.cost !== undefined ||
                item.notes) ? (
                <div className="space-y-2 border-t border-border/70 px-4 pb-4 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.isVisited && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        Visited
                      </span>
                    )}
                    {item.time && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-info/10 px-3 py-2 text-xs font-medium text-info">
                        <Clock className="size-3" aria-hidden="true" />
                        {item.timeEnd
                          ? `${formatDisplayTime(item.time)} – ${formatDisplayTime(item.timeEnd)}`
                          : formatDisplayTime(item.time)}
                      </span>
                    )}
                    {item.cost !== undefined && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
                        {currency.symbol} {item.cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.notes}
                    </p>
                  )}
                </div>
              ) : null}
            </>
          )}
        </>
      )}
      <ObservedSocControl blockId={blockId} itemId={item.id} value={item.observedSocCheckpoint?.socPct} />
    </article>
  );
}
