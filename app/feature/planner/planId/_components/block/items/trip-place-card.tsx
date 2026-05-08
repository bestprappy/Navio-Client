"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import {
  BatteryCharging,
  CheckCircle2,
  Clock,
  MapPin,
  Plug,
  Star,
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
  updatePlaceItemAtom,
} from "../../overview/trip-builder.atoms";

type TripPlaceCardProps = {
  blockId: string;
  blockColorId: TripBlockColorId;
  item: PlaceItem;
  position: number | null;
};

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
  if (maxKw >= 100) {
    return 35;
  }

  if (maxKw >= 50) {
    return 50;
  }

  if (maxKw >= 22) {
    return 90;
  }

  return 150;
}

function getFallbackMaxKw(item: PlaceItem): number | null {
  const match = item.description?.match(/up to\s+(\d+)\s*kW/i);
  const value = match ? Number(match[1]) : Number.NaN;

  return Number.isFinite(value) ? value : null;
}

function getFallbackConnectorText(item: PlaceItem): string | null {
  const match = item.description?.match(/station\s+-\s+(.+?)\s+-\s+up to/i);

  if (!match?.[1]) {
    return null;
  }

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
      : getFallbackConnectorText(item) ?? "Connector info unavailable",
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
  item,
  position,
}: TripPlaceCardProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
  const selectTripPlace = useSetAtom(selectTripPlaceAtom);
  const selectedTripPlaceItemId = useAtomValue(
    selectedTripPlaceItemIdReadonlyAtom,
  );
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
      {!isEvCharger && item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          width={640}
          height={240}
          className="h-32 w-full object-cover"
        />
      ) : null}

      <div className="space-y-4 p-4">
        {isEvCharger && chargerSpecs ? (
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
                <span className="font-medium text-foreground">Connector:</span>
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
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={markerStyle}
                aria-label={`Place ${position ?? ""}`.trim()}
              >
                {position}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold leading-snug text-foreground">
                    {item.name}
                  </h3>
                  {item.rating ? (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      <Star
                        className="size-3 fill-yellow-500 text-yellow-500"
                        aria-hidden="true"
                      />
                      {item.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item.address}</span>
                </p>
              </div>
            </div>

            {item.description ? (
              <p className="rounded-sm bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
                From the web: {item.description}
              </p>
            ) : null}
          </>
        )}

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
          placeholder={
            isEvCharger
              ? "Add charging notes, bay number, receipt, etc."
              : "Add notes, links, etc. here"
          }
          aria-label={`Notes for ${item.name}`}
          rows={3}
          className="min-h-20 w-full resize-y rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
          <Button
            type="button"
            variant={
              item.isVisited ? "secondary" : isEvCharger ? "default" : "outline"
            }
            size="sm"
            className="rounded-sm"
            onClick={(event) => {
              event.stopPropagation();
              updatePlaceItem({
                blockId,
                itemId: item.id,
                updates: { isVisited: !item.isVisited },
              });
            }}
          >
            {isEvCharger ? (
              <>
                {item.isVisited ? (
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                ) : (
                  <Zap className="size-3.5" aria-hidden="true" />
                )}
                {item.isVisited ? "Charging completed" : "Mark as charged"}
              </>
            ) : item.isVisited ? (
              "Visited"
            ) : (
              "Mark as visited"
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
      </div>
    </article>
  );
}
