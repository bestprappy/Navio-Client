"use client";

import type { CSSProperties } from "react";
import {
  BatteryCharging,
  CheckCircle2,
  Clock,
  MapPin,
  Plug,
  Trash2,
  Zap,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../../constants/trip-block-colors";
import {
  type EvConnectorType,
  isEvChargerPlaceItem,
  type PlaceItem,
  type TripBlockColorId,
} from "../../constants/types";
import {
  removeItemFromBlockAtom,
  selectedTripPlaceItemIdReadonlyAtom,
  selectTripPlaceAtom,
  tripCurrencyAtom,
  updatePlaceItemAtom,
} from "../../overview/trip-builder.atoms";
import { ChargeSegmentInfo } from "../../routes/charge-segment-info";
import { PlaceCardVisual } from "./place-card-visual";
import { PlaceCostPopover } from "./place-cost-popover";
import { PlaceTimePopover } from "./place-time-popover";

type TripPlaceCardProps = {
  blockId: string;
  blockColorId: TripBlockColorId;
  blockDate: string;
  item: PlaceItem;
  position: number | null;
  chargeBatteryFrom?: number;
  chargeBatteryTo?: number;
  showEvChargeDetails?: boolean;
};

function formatDisplayTime(time: string): string {
  const [hourStr, minuteStr = "00"] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function formatConnectorLabel(connector: EvConnectorType | string): string {
  switch (connector) {
    case "TYPE2":
      return "Type 2";
    case "CHADEMO":
      return "CHAdeMO";
    case "GB_T":
      return "GB/T";
    default:
      return connector;
  }
}

function getEstimatedChargeMinutes(maxKw: number): number {
  if (maxKw >= 100) return 35;
  if (maxKw >= 50) return 50;
  if (maxKw >= 22) return 90;
  return 150;
}

function getFallbackMaxKw(item: PlaceItem): number | null {
  const match = item.description?.match(/up to\s+(\d+)\s*kW/i);
  const value = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(value) ? value : null;
}

function getFallbackConnectorText(item: PlaceItem): string | null {
  const match = item.description?.match(/station\s+-\s+(.+?)\s+-\s+up to/i);
  if (!match?.[1]) return null;
  return match[1]
    .split(",")
    .map((connector) => formatConnectorLabel(connector.trim()))
    .join(", ");
}

function getChargerSpecs(item: PlaceItem) {
  const maxKw = item.evCharger?.maxKw ?? getFallbackMaxKw(item);
  return {
    connectors: item.evCharger?.connectorTypes.length
      ? item.evCharger.connectorTypes.map(formatConnectorLabel).join(", ")
      : (getFallbackConnectorText(item) ?? "Connector info unavailable"),
    power: maxKw ? `${maxKw} kW` : "Power not listed",
    availability: item.evCharger
      ? item.evCharger.availableConnectors === null
        ? `${item.evCharger.totalConnectors} plugs`
        : `${item.evCharger.availableConnectors} / ${item.evCharger.totalConnectors} plugs`
      : "Availability not listed",
    chargeTime:
      item.evCharger?.estimatedChargeMinutes || maxKw
        ? `${
            item.evCharger?.estimatedChargeMinutes ??
            getEstimatedChargeMinutes(maxKw ?? 0)
          } min`
        : "Time not listed",
    price: item.evCharger?.priceText ?? "Price not listed",
    open: item.evCharger?.openingHoursSummary ?? "Hours not listed",
    operator: item.evCharger?.operatorName,
  };
}

export function TripPlaceCard({
  blockId,
  blockColorId,
  blockDate,
  item,
  position,
  chargeBatteryFrom,
  chargeBatteryTo,
}: TripPlaceCardProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
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
  const selectedStyle: CSSProperties | undefined = isSelected
    ? {
        borderColor: blockColor.value,
        boxShadow: `0 0 0 2px color-mix(in oklch, ${blockColor.value} 28%, transparent)`,
      }
    : undefined;
  const chargerSpecs = isEvCharger ? getChargerSpecs(item) : null;

  return (
    <article
      className={cn(
        "cursor-pointer overflow-hidden rounded-sm border shadow-xs transition-all duration-300 ease-in-out active:scale-95",
        isEvCharger
          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
          : "border-border bg-card",
        isSelected && "border-2",
      )}
      style={selectedStyle}
      onClick={() => selectTripPlace({ itemId: item.id })}
    >
      {isEvCharger ? (
        /* ── EV charger branch ── */
        <div className="space-y-4 p-4">
          {chargerSpecs ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-sm text-xs font-bold shadow-xs"
                  style={markerStyle}
                  aria-label="EV charging station"
                >
                  <Zap className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-6 rounded-sm border-primary/30 bg-background/70 px-2 text-primary"
                    >
                      <Zap className="size-3" aria-hidden="true" />
                      Charging Stop
                    </Badge>
                    {chargerSpecs.operator ? (
                      <Badge variant="secondary" className="h-6 rounded-sm">
                        {chargerSpecs.operator}
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-base font-bold leading-snug text-foreground">
                    {item.name}
                  </h3>
                </div>
              </div>

              <div className="grid gap-2 rounded-sm border border-primary/15 bg-background/80 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Plug
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    Connector:
                  </span>
                  <span className="text-muted-foreground">
                    {chargerSpecs.connectors}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <BatteryCharging
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">Power:</span>
                  <span className="text-muted-foreground">
                    {chargerSpecs.power}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    Available plugs:
                  </span>
                  <span className="text-muted-foreground">
                    {chargerSpecs.availability}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    Estimated charging time:
                  </span>
                  <span className="text-muted-foreground">
                    {chargerSpecs.chargeTime}
                  </span>
                </div>
                <div className="grid gap-1 border-t border-border/70 pt-2 text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Price:</span>{" "}
                    {chargerSpecs.price}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Open:</span>{" "}
                    {chargerSpecs.open}
                  </div>
                </div>
              </div>

              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{item.address}</span>
              </p>
            </div>
          ) : null}

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
              <ChargeSegmentInfo
                batteryFrom={chargeBatteryFrom}
                batteryTo={chargeBatteryTo}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
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
              <ChargeSegmentInfo
                batteryFrom={chargeBatteryFrom}
                batteryTo={chargeBatteryTo}
              />
              {item.isVisited && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
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
                      <span className="inline-flex items-center gap-1 rounded-sm bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        Visited
                      </span>
                    )}
                    {item.time && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-400">
                        <Clock className="size-3" aria-hidden="true" />
                        {item.timeEnd
                          ? `${formatDisplayTime(item.time)} – ${formatDisplayTime(item.timeEnd)}`
                          : formatDisplayTime(item.time)}
                      </span>
                    )}
                    {item.cost !== undefined && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
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
    </article>
  );
}
