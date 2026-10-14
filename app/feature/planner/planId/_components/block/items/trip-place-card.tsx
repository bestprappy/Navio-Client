"use client";
import { ObservedSocControl } from "./observed-soc-control";

import type { CSSProperties } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  LockKeyhole,
  LockKeyholeOpen,
  MapPin,
  Route,
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
  plannerReadOnlyAtom,
  removeItemFromBlockAtom,
  selectedTripPlaceItemIdReadonlyAtom,
  selectTripPlaceAtom,
  updatePlaceItemAtom,
} from "../../overview/trip-builder.atoms";
import { StationChargingControl } from "../../charger/station-charging-control";
import { StationSpecifications } from "../../charger/station-specifications";
import { ChargeSegmentInfo } from "../../routes/charge-segment-info";
import { PlaceCardVisual } from "./place-card-visual";
import { PlaceCardFrame } from "./place-card-frame";
import { PlaceExpenseList } from "./place-expense-list";
import { PlaceTimePopover } from "./place-time-popover";
import { PlaceNotesEditor, PlaceNotesPreview } from "./place-notes";
import { StopScheduleEditor } from "./stop-schedule/stop-schedule-editor";
import { StopScheduleList } from "./stop-schedule/stop-schedule-list";
import { PlaceOpeningHours } from "../../place/place-opening-hours";
import { describeTimingIssue, isFixedTime } from "../../itinerary/day-timing";

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
  /** Minutes short of reaching this stop's fixed time, after the day's times are calculated. */
  lateMinutes?: number | null;
};

function LateWarning({ name, minutes }: { name: string; minutes: number }) {
  return (
    // A div: the itinerary accordion adds a bottom margin to every paragraph that is not last.
    <div className="flex items-start gap-1.5 rounded-sm bg-warning/10 px-2.5 py-1.5 text-xs text-foreground">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
      <span>{describeTimingIssue({ kind: "late", itemId: "", name, minutes })}</span>
    </div>
  );
}

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
  lateMinutes,
}: TripPlaceCardProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
  const markPlaceAsDayEnd = useSetAtom(markPlaceAsDayEndAtom);
  const selectTripPlace = useSetAtom(selectTripPlaceAtom);
  const selectedTripPlaceItemId = useAtomValue(
    selectedTripPlaceItemIdReadonlyAtom,
  );
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const isSelected = selectedTripPlaceItemId === item.id;
  // A shared plan keeps selection (it drives the map) but never opens the editor.
  const isEditing = isSelected && !readOnly;
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
    <PlaceCardFrame
      className={cn(
        "cursor-pointer",
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
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Charging stop{chargerDetails?.operatorName ? `, ${chargerDetails.operatorName}` : ""}
                </span>
                {chargerDetails?.locked ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                    <LockKeyhole className="size-3" aria-hidden="true" />
                    Kept when optimizing
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <StationSpecifications item={item} />

          {item.address && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{item.address}</span>
            </p>
          )}

          {chargerDetails && !readOnly && (
            <div className="border-t border-border pt-4">
              <StationChargingControl blockId={blockId} itemId={item.id} stationName={item.name} details={chargerDetails} arrivalPct={chargeBatteryFrom} />
            </div>
          )}

          {isEditing ? (
            <>
              <PlaceNotesEditor
                blockId={blockId}
                itemId={item.id}
                itemName={item.name}
                value={item.notes ?? ""}
                placeholder="Add charging notes, bay number, receipt, or type / for blocks"
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
              {item.notes ? <PlaceNotesPreview value={item.notes} interactive={readOnly} /> : null}
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
            placeType={item.placeType}
            position={position}
            colorId={blockColorId}
          />

          <PlaceOpeningHours placeId={item.placeId} />

          {!readOnly && <ObservedSocControl blockId={blockId} itemId={item.id} value={item.observedSocCheckpoint?.socPct} />}

          {isEditing ? (
            <div className="space-y-4 border-t border-border/70 px-4 pb-4 pt-3">
              {/* The stop's time heads its own timetable, so both are set in one place. */}
              <div className="space-y-2">
                <PlaceTimePopover
                  blockId={blockId}
                  itemId={item.id}
                  time={item.time}
                  timeEnd={item.timeEnd}
                  timeSource={item.timeSource}
                />
                <StopScheduleEditor blockId={blockId} item={item} />
              </div>
              {lateMinutes ? <LateWarning name={item.name} minutes={lateMinutes} /> : null}
              <PlaceNotesEditor
                blockId={blockId}
                itemId={item.id}
                itemName={item.name}
                value={item.notes ?? ""}
                placeholder="Add notes, links, or type / for lists and to-dos"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
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
                item.notes?.trim() ||
                item.schedule?.length ||
                lateMinutes) ? (
                <div className="space-y-3 border-t border-border/70 px-4 pb-4 pt-3">
                  {item.isVisited || item.time ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.isVisited && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        Visited
                      </span>
                    )}
                    {item.time && (
                      // Times follow the block colour; fixed times are filled and calculated ones are dashed.
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm px-3 py-2 text-xs tabular-nums",
                          isFixedTime(item)
                            ? "border border-primary/20 bg-primary/10 font-medium text-primary"
                            : "border border-dashed border-primary/35 font-medium text-primary",
                        )}
                        title={isFixedTime(item) ? "Fixed time" : "Calculated time"}
                      >
                        {isFixedTime(item) ? null : <Route className="size-3" aria-hidden="true" />}
                        <span className="sr-only">{isFixedTime(item) ? "Fixed time: " : "Calculated time: "}</span>
                        {item.timeEnd
                          ? `${formatDisplayTime(item.time)} – ${formatDisplayTime(item.timeEnd)}`
                          : formatDisplayTime(item.time)}
                      </span>
                    )}
                  </div>
                  ) : null}
                  <StopScheduleList item={item} />
                  {lateMinutes ? <LateWarning name={item.name} minutes={lateMinutes} /> : null}
                  {item.notes ? <PlaceNotesPreview value={item.notes} interactive={readOnly} /> : null}
                </div>
              ) : null}
            </>
          )}
          <PlaceExpenseList
            blockId={blockId}
            itemId={item.id}
            itemName={item.name}
            blockDate={blockDate}
            cost={item.cost}
            readOnly={readOnly}
            editable={isEditing}
          />
        </>
      )}
    </PlaceCardFrame>
  );
}
