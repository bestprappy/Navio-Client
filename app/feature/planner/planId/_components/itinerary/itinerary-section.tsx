"use client";

import { type ReactNode, useState } from "react";
import { useParams } from "next/navigation";
import { useTripMetadata, useUpdateTripMetadata } from "../../../_components/use-trip-metadata";
import { DayDestinationPicker } from "./day-destination-picker";
import { resolveDayDestinations } from "./day-destinations";
import { AutoPlanUndoNotice } from "../auto-plan/auto-plan-undo-notice";
import { focusedAnchorAtom } from "./anchor-map.atoms";
import { AnchorStopCard, EndAnchorRouteInfo } from "./anchor-stop-card";
import { getTripBlockColorById } from "../constants/trip-block-colors";
import { DayAnchorRail } from "./day-anchor-rail";
import { EMPTY_DAY_ANCHORS, getDayPlacePositions, resolveDayAnchors } from "./day-anchors";
import { isPlaceItem, type TripAnchor, type TripBlockData, type TripDestination } from "../constants/types";
import { useTripDates } from "../overview/use-trip-dates";
import { CalendarIcon, CalendarPlus, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { addDays, format, isAfter, parseISO } from "date-fns";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { cn } from "@/lib/utils";

import {
  addTripBlocksForDatesAtom,
  itineraryBlocksAtom,
  setDayAnchorAtom,
  tripBlocksAtom,
  openBlockIdsAtom,
  plannerReadOnlyAtom,
  toggleBlockOpenAtom,
  type DayAnchorEdge,
} from "../overview/trip-builder.atoms";
import { TripBlock } from "../block/trip-block";
import { DayRouteOverview } from "../garage/day-route-overview";
import { EmptyItineraryCallout } from "./empty-itinerary-callout";
import { ItineraryOptionsPopover } from "./itinerary-options-popover";
import { InlineAddDivider } from "../inline-add-divider";
import { PopularPlaces } from "../guide/popular-places";
import { ItineraryViewSwitch } from "./table/itinerary-view-switch";
import { ItineraryDayControls } from "./itinerary-day-controls";
import { itineraryDayViewAtom, visibleItineraryDaysAtom, selectItineraryDayAtom } from "./itinerary-day-view.atoms";

function getNextAvailableBlockDate(
  from: Date,
  to: Date,
  existingDates: Set<string>,
): string | null {
  for (let day = from; !isAfter(day, to); day = addDays(day, 1)) {
    const dateValue = format(day, "yyyy-MM-dd");

    if (!existingDates.has(dateValue)) {
      return dateValue;
    }
  }

  return null;
}

type ItinerarySectionProps = {
  destinationName: string;
  latitude: number;
  longitude: number;
  /** Read-only plans show where each day starts and ends here, in place of the anchor editor. */
  renderDayAnchors?: (block: TripBlockData) => ReactNode;
};

export function ItinerarySection({
  destinationName,
  latitude,
  longitude,
  renderDayAnchors,
}: ItinerarySectionProps) {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const dayView = useAtomValue(itineraryDayViewAtom);
  const visibleDays = useAtomValue(visibleItineraryDaysAtom);
  const selectDay = useSetAtom(selectItineraryDayAtom);
  const store = useStore();
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const params = useParams<{ planId?: string }>();
  const metadata = useTripMetadata(readOnly ? undefined : params.planId);
  const updateMetadata = useUpdateTripMetadata(readOnly ? undefined : params.planId);
  const setBlocks = useSetAtom(tripBlocksAtom);
  const [openIds, setOpenIds] = useAtom(openBlockIdsAtom);
  const toggleOpen = useSetAtom(toggleBlockOpenAtom);
  const areAllDaysOpen = blocks.length > 0 && blocks.every((block) => openIds.includes(block.id));
  function toggleAllDays() {
    setOpenIds((ids) =>
      areAllDaysOpen
        ? ids.filter((id) => !blocks.some((block) => block.id === id))
        : [...new Set([...ids, ...blocks.map((block) => block.id)])],
    );
  }
  const initialDestination: TripDestination = {
    id: metadata.data?.destinationId ?? destinationName,
    name: metadata.data?.destinationName ?? destinationName,
    lat: metadata.data?.destinationLat ?? latitude,
    lng: metadata.data?.destinationLng ?? longitude,
  };
  const destinations = resolveDayDestinations(blocks, initialDestination);
  const dayAnchors = resolveDayAnchors(blocks);
  const setDayAnchor = useSetAtom(setDayAnchorAtom);
  const focusAnchor = useSetAtom(focusedAnchorAtom);
  const firstBlockId = [...blocks].sort((a, b) => a.date.localeCompare(b.date))[0]?.id;
  function changeAnchor(blockId: string, edge: DayAnchorEdge, anchor: TripAnchor | null) {
    setDayAnchor({ blockId, edge, anchor });
    focusAnchor(anchor);
  }
  async function changeDestination(blockId: string, destination: TripDestination | null) {
    if (blockId === firstBlockId && destination) {
      await updateMetadata.mutateAsync({ destinationId: destination.id });
    }
    setBlocks((current) => current.map((block) => block.id === blockId ? { ...block, destination } : block));
  }
  const { pickerValue, changeRange, isPending: isSavingDates, isError: datesSaveFailed, isReady: datesReady } = useTripDates();
  const addBlocksForDates = useSetAtom(addTripBlocksForDatesAtom);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const tripFrom = pickerValue?.from;
  const tripTo = pickerValue?.to;
  const existingDates = new Set(blocks.map((block) => block.date));
  const nextBlockDate =
    tripFrom && tripTo
      ? getNextAvailableBlockDate(tripFrom, tripTo, existingDates)
      : null;

  function handleAddBlock() {
    if (!nextBlockDate) return;
    addBlocksForDates([nextBlockDate]);
    if (dayView === "single") {
      const newDay = store.get(itineraryBlocksAtom).find((day) => day.date === nextBlockDate);
      if (newDay) selectDay(newDay.id);
    }
  }

  const tripDateLabel =
    tripFrom && tripTo
      ? `${format(tripFrom, "MMM d")} – ${format(tripTo, "MMM d")}`
      : tripFrom
        ? format(tripFrom, "MMM d")
        : null;

  const addBlockTitle =
    !tripFrom || !tripTo
      ? "Choose a trip date range first"
      : nextBlockDate
        ? `Add day for ${format(parseISO(nextBlockDate), "MMM d")}`
        : "Every date in this trip already has a day";

  return (
    <section className="px-4 py-4 ">
      <Accordion defaultValue={["itinerary"]}>
        <AccordionItem value="itinerary" className="border-none">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <AccordionTrigger
              iconSide="left"
              className="items-center py-0 text-2xl font-bold text-foreground hover:text-primary hover:no-underline"
            >
              Itinerary
            </AccordionTrigger>

            {readOnly ? (
              tripDateLabel && (
                <p className="flex items-center gap-1.5 py-1 text-sm text-muted-foreground">
                  <CalendarIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  {tripDateLabel}
                </p>
              )
            ) : <div className="flex min-w-0 flex-wrap items-center gap-2">
              {isEditingDates || !tripDateLabel ? (
                <DateRangePicker
                  value={pickerValue}
                  onChange={(range) => changeRange(range, () => setIsEditingDates(false))}
                  disabled={isSavingDates || !datesReady}
                  startPlaceholder="Start date"
                  endPlaceholder="End date"
                  className="w-full min-w-0 max-w-[25rem]"
                />
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label={`Change dates: ${tripDateLabel}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingDates(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <CalendarIcon
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {tripDateLabel}
                </button>
              )}

              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full gap-1.5",
                )}
                disabled={!nextBlockDate}
                title={addBlockTitle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddBlock();
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <CalendarPlus className="size-3.5" aria-hidden="true" />
                Add day
              </button>
            </div>}
          </div>

          {isSavingDates && <p role="status" className="mb-2 text-xs text-muted-foreground">Saving dates...</p>}
          {datesSaveFailed && <p role="alert" className="mb-2 text-xs text-destructive">Dates could not be saved. Please select your dates again to retry.</p>}
          <AccordionContent className="pt-0">
            <div className="space-y-4 pb-10 pt-2">
              {blocks.length === 0 && readOnly ? (
                <p className="text-sm text-muted-foreground">This plan does not have any days yet.</p>
              ) : blocks.length === 0 ? (
                <EmptyItineraryCallout
                  nextBlockDate={nextBlockDate}
                  tripDateLabel={tripDateLabel}
                  onAddBlock={handleAddBlock}
                  onChooseDates={() => setIsEditingDates(true)}
                />
              ) : (
                <>
                  <div className="space-y-3 border-b border-border/60 pb-4">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                    <ItineraryViewSwitch />
                    <div className="flex shrink-0 items-center gap-1">
                    {dayView === "all" && <button
                      type="button"
                      aria-expanded={areAllDaysOpen}
                      aria-label={areAllDaysOpen ? "Collapse all days" : "Expand all days"}
                      title={areAllDaysOpen ? "Collapse all days" : "Expand all days"}
                      className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      onClick={toggleAllDays}
                    >
                      {areAllDaysOpen ? (
                        <ChevronsDownUp className="size-4" aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown className="size-4" aria-hidden="true" />
                      )}
                      <span className="hidden @sm/planner:inline">{areAllDaysOpen ? "Collapse all" : "Expand all"}</span>
                    </button>}
                    <ItineraryOptionsPopover />
                    </div>
                    </div>
                    <ItineraryDayControls />
                  </div>
                  {visibleDays.map(({ block, index }) => {
                    const destination = destinations.get(block.id) ?? initialDestination;
                    const anchors = dayAnchors.get(block.id) ?? EMPTY_DAY_ANCHORS;
                    const placeCount = getDayPlacePositions(block, !!anchors.start).size;
                    const isOpen = dayView === "single" || openIds.includes(block.id);
                    return <TripBlock.Root
                      key={block.id}
                      block={block}
                      variant="day"
                      readOnly={readOnly}
                    >
                      <TripBlock.Header>
                        <TripBlock.Title />
                        {readOnly ? null : <AutoPlanUndoNotice blockId={block.id} />}
                        {readOnly ? renderDayAnchors?.(block) : <>
                        <DayDestinationPicker destination={destination} isFirstDay={block.id === firstBlockId} isOverride={!!block.destination} onChange={(next) => changeDestination(block.id, next)} />
                        <DayAnchorRail.Root
                          anchors={dayAnchors.get(block.id) ?? EMPTY_DAY_ANCHORS}
                          dayLabel={`Day ${index + 1}`}
                          isFirstDay={block.id === firstBlockId}
                          dayPlaces={block.items.filter(isPlaceItem)}
                          searchBias={{ lat: destination.lat, lng: destination.lng }}
                          ownStart={block.startAnchor ?? null}
                          ownEnd={block.endAnchor ?? null}
                          onChange={(edge, anchor) => changeAnchor(block.id, edge, anchor)}
                          className={cn(!isOpen && "px-3 py-2.5")}
                        >
                          {isOpen ? (
                            <>
                              <DayAnchorRail.Start />
                              <DayAnchorRail.End />
                            </>
                          ) : (
                            // Collapsed days stay scannable: a long trip would
                            // otherwise show two full anchor rows per day.
                            <DayAnchorRail.Summary />
                          )}
                        </DayAnchorRail.Root>
                        <PopularPlaces blockId={block.id} destination={destination} />
                        </>}
                        {dayView === "all" && <button type="button" aria-expanded={isOpen} aria-controls={`day-content-${block.id}`} className="flex min-h-10 w-full items-center justify-between rounded-lg px-2 text-sm text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => toggleOpen(block.id)}>
                          <span>{block.items.length} {block.items.length === 1 ? "item" : "items"}</span><span>{isOpen ? "Show less" : "Show more"}</span>
                        </button>}
                      </TripBlock.Header>
                      <div id={`day-content-${block.id}`} hidden={!isOpen}>
                      {isOpen && <TripBlock.Content>
                        <AnchorStopCard blockId={block.id} edge="start" anchor={anchors.start} position={1} colorId={block.colorId} />
                        <TripBlock.Items hasStart={!!anchors.start} placeSearchBias={{ label: destination.name, lat: destination.lat, lng: destination.lng }} />
                        {anchors.end && (anchors.start || block.items.some(isPlaceItem)) && <EndAnchorRouteInfo blockId={block.id} routeColor={getTripBlockColorById(block.colorId).value} />}
                        <AnchorStopCard blockId={block.id} edge="end" anchor={anchors.end} position={placeCount + (anchors.start ? 2 : 1)} colorId={block.colorId} />
                        <DayRouteOverview
                          blockId={block.id}
                          blockIndex={index}
                        />
                        {!readOnly && <TripBlock.Actions
                          evSearchAnchor={{
                            id: `destination-${block.id}`,
                            lat: destination.lat,
                            lng: destination.lng,
                          }}
                          placeSearchBias={{
                            label: destination.name,
                            lat: destination.lat,
                            lng: destination.lng,
                          }}
                        />}
                      </TripBlock.Content>}
                      </div>
                    </TripBlock.Root>;
                  })}

                  {nextBlockDate && !readOnly && (
                    <InlineAddDivider
                      onClick={handleAddBlock}
                      label={`Add day for ${format(parseISO(nextBlockDate), "MMM d")}`}
                    />
                  )}
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
