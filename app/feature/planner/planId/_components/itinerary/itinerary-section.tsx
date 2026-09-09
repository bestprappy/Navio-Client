"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTripMetadata, useUpdateTripMetadata } from "../../../_components/use-trip-metadata";
import { DayDestinationPicker } from "./day-destination-picker";
import { resolveDayDestinations } from "./day-destinations";
import type { TripDestination } from "../constants/types";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, CalendarPlus } from "lucide-react";
import { addDays, format, isAfter, parseISO } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

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
  tripDateRangeAtom,
  tripBlocksAtom,
  openBlockIdsAtom,
  toggleBlockOpenAtom,
} from "../overview/trip-builder.atoms";
import { TripBlock } from "../block/trip-block";
import { DayRouteOverview } from "../garage/day-route-overview";
import { EmptyItineraryCallout } from "./empty-itinerary-callout";
import { InlineAddDivider } from "../inline-add-divider";

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
};

export function ItinerarySection({
  destinationName,
  latitude,
  longitude,
}: ItinerarySectionProps) {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const params = useParams<{ planId?: string }>();
  const metadata = useTripMetadata(params.planId);
  const updateMetadata = useUpdateTripMetadata(params.planId);
  const setBlocks = useSetAtom(tripBlocksAtom);
  const [openIds, setOpenIds] = useAtom(openBlockIdsAtom);
  const toggleOpen = useSetAtom(toggleBlockOpenAtom);
  const initialDestination: TripDestination = {
    id: metadata.data?.destinationId ?? destinationName,
    name: metadata.data?.destinationName ?? destinationName,
    lat: metadata.data?.destinationLat ?? latitude,
    lng: metadata.data?.destinationLng ?? longitude,
  };
  const destinations = resolveDayDestinations(blocks, initialDestination);
  const firstBlockId = [...blocks].sort((a, b) => a.date.localeCompare(b.date))[0]?.id;
  async function changeDestination(blockId: string, destination: TripDestination | null) {
    if (blockId === firstBlockId && destination) {
      await updateMetadata.mutateAsync({ destinationId: destination.id, destinationName: destination.name, destinationLat: destination.lat, destinationLng: destination.lng, destinationCountry: destination.country });
    }
    setBlocks((current) => current.map((block) => block.id === blockId ? { ...block, destination } : block));
  }
  const [tripDateRange, setTripDateRange] = useAtom(tripDateRangeAtom);
  const addBlocksForDates = useSetAtom(addTripBlocksForDatesAtom);
  const [isEditingDates, setIsEditingDates] = useState(false);

  const tripFrom = tripDateRange.from
    ? parseISO(tripDateRange.from)
    : undefined;
  const tripTo = tripDateRange.to ? parseISO(tripDateRange.to) : undefined;
  const pickerValue: DateRange | undefined = tripFrom
    ? { from: tripFrom, to: tripTo }
    : undefined;
  const existingDates = new Set(blocks.map((block) => block.date));
  const nextBlockDate =
    tripFrom && tripTo
      ? getNextAvailableBlockDate(tripFrom, tripTo, existingDates)
      : null;

  function handleAddBlock() {
    if (!nextBlockDate) return;
    addBlocksForDates([nextBlockDate]);
  }

  function handleRangeChange(range: DateRange | undefined) {
    setTripDateRange({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
    });

    if (range?.from && range?.to) {
      setIsEditingDates(false);
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

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {isEditingDates || !tripDateLabel ? (
                <DateRangePicker
                  value={pickerValue}
                  onChange={handleRangeChange}
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
            </div>
          </div>

          <AccordionContent className="pt-0">
            <div className="space-y-4 pb-10 pt-2">
              {blocks.length === 0 ? (
                <EmptyItineraryCallout
                  nextBlockDate={nextBlockDate}
                  tripDateLabel={tripDateLabel}
                  onAddBlock={handleAddBlock}
                  onChooseDates={() => setIsEditingDates(true)}
                />
              ) : (
                <>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" className="min-h-10 rounded-lg px-3 text-sm text-primary hover:bg-muted" onClick={() => setOpenIds((ids) => [...new Set([...ids, ...blocks.map((block) => block.id)])])}>Expand all days</button>
                    <button type="button" className="min-h-10 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted" onClick={() => setOpenIds((ids) => ids.filter((id) => !blocks.some((block) => block.id === id)))}>Collapse all days</button>
                  </div>
                  {blocks.map((block, index) => {
                    const destination = destinations.get(block.id) ?? initialDestination;
                    const isOpen = openIds.includes(block.id);
                    return <TripBlock.Root
                      key={block.id}
                      block={block}
                      className="mb-6 rounded-xl border border-border bg-card/35 p-3 @lg/planner:p-4"
                    >
                      <TripBlock.Header>
                        <TripBlock.Title />
                        <DayDestinationPicker destination={destination} isFirstDay={block.id === firstBlockId} isOverride={!!block.destination} onChange={(next) => changeDestination(block.id, next)} />
                        <button type="button" aria-expanded={isOpen} aria-controls={`day-content-${block.id}`} className="flex min-h-10 w-full items-center justify-between rounded-lg px-2 text-sm text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => toggleOpen(block.id)}>
                          <span>{block.items.length} {block.items.length === 1 ? "item" : "items"}</span><span>{isOpen ? "Show less" : "Show more"}</span>
                        </button>
                      </TripBlock.Header>
                      <div id={`day-content-${block.id}`} hidden={!isOpen}>
                      {isOpen && <TripBlock.Content>
                        <TripBlock.Items />
                        <DayRouteOverview
                          blockId={block.id}
                          blockIndex={index}
                        />
                        <TripBlock.Actions
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
                        />
                      </TripBlock.Content>}
                      </div>
                    </TripBlock.Root>;
                  })}

                  {nextBlockDate && (
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
