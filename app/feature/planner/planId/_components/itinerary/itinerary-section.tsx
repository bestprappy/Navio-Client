"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarPlus, CalendarIcon } from "lucide-react";
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
  tripBlocksAtom,
  tripDateRangeAtom,
} from "../overview/trip-builder.atoms";
import { TripBlock } from "../block/trip-block";

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

export function ItinerarySection() {
  const blocks = useAtomValue(tripBlocksAtom);
  const [tripDateRange, setTripDateRange] = useAtom(tripDateRangeAtom);
  const addBlocksForDates = useSetAtom(addTripBlocksForDatesAtom);
  const [isEditingDates, setIsEditingDates] = useState(false);

  const tripFrom = tripDateRange.from ? parseISO(tripDateRange.from) : undefined;
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

  const addBlockTitle = !tripFrom || !tripTo
    ? "Choose a trip date range first"
    : nextBlockDate
      ? `Add block for ${format(parseISO(nextBlockDate), "MMM d")}`
      : "Every date in this trip already has a block";

  return (
    <section className="px-4 py-4 ">
      <Accordion defaultValue={["itinerary"]}>
        <AccordionItem value="itinerary" className="border-none">
          <div className="mb-6 flex items-center justify-between">
            <AccordionTrigger
              iconSide="left"
              className="items-center py-0 text-2xl font-bold text-foreground hover:text-primary hover:no-underline"
            >
              Itinerary
            </AccordionTrigger>

            <div className="mr-6 flex items-center gap-2">
              {isEditingDates || !tripDateLabel ? (
                <DateRangePicker
                  value={pickerValue}
                  onChange={handleRangeChange}
                  startPlaceholder="Start date"
                  endPlaceholder="End date"
                  className="w-full min-w-xs max-w-[25rem]"
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
                  <CalendarIcon className="size-3.5 shrink-0" aria-hidden="true" />
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
                Add block
              </button>
            </div>
          </div>

          <AccordionContent className="pt-0">
            <div className="space-y-4 pb-10 pt-2">
              {blocks.map((block) => (
                <TripBlock.Root key={block.id} block={block} className="mb-12">
                  <TripBlock.Header>
                    <TripBlock.Title />
                  </TripBlock.Header>
                  <TripBlock.Content>
                    <TripBlock.Items />
                    <TripBlock.Actions />
                  </TripBlock.Content>
                </TripBlock.Root>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
