"use client";

import { useState } from "react";
import { ChevronRight, Footprints } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatRouteDuration, safeLineColor } from "./trip-route.helpers";
import type { TransitJourney as TransitJourneyData } from "./trip-route.types";
import { getLineTextColor, getTransitVehicleLabel } from "./travel-options";
import { formatTransitFare } from "./transit-journey.helpers";
import { getJourneyVehicleKinds, type TransitVehicleKind } from "./transit-journey-filters";
import { TRANSIT_VEHICLE_ICON } from "./transit-vehicle-icon";
import { TransitJourney } from "./transit-journey";

/** `topLabel` names why the first route leads, e.g. "Fastest" under the active sort. */
export function TransitJourneyList({ journeys, selectedId, onSelect, routeColor, originName, destinationName, insertion, topLabel }: {
  journeys: TransitJourneyData[]; selectedId: string | null; onSelect: (id: string) => void; routeColor: string;
  originName: string; destinationName: string; insertion?: { blockId: string; beforeItemId: string }; topLabel?: string;
}) {
  const [detailsId, setDetailsId] = useState<string | null>(null);
  return (
    <RadioGroup aria-label="Choose a transit route" value={selectedId ?? journeys[0]?.id} onValueChange={onSelect}>
    <Accordion aria-label="Transit route alternatives" value={detailsId ? [detailsId] : []}
      onValueChange={(values: unknown[]) => setDetailsId(typeof values[0] === "string" ? values[0] : null)}>
      {journeys.map((journey, index) => {
        const fare = formatTransitFare(journey);
        const rides = journey.steps.filter(step => step.travelMode === "transit");
        const transfers = Math.max(0, rides.length - 1);
        const selected = selectedId === journey.id || (!selectedId && index === 0);
        const kinds = getJourneyVehicleKinds(journey).filter(item => item !== "Other");
        const kind = kinds.length ? kinds.join(" + ") : "Public transit";
        return (
          <AccordionItem key={journey.id} value={journey.id} className="py-1">
            <div className="flex items-start gap-3">
            <RadioGroupItem className="mt-4" value={journey.id} aria-label={`Select route ${index + 1}: ${kind}, ${formatRouteDuration(journey.durationSeconds)}`} />
            <div className="min-w-0 flex-1">
            <AccordionTrigger aria-label={`Route ${index + 1}: ${kind}, ${formatRouteDuration(journey.durationSeconds)}. Details`}
              className="items-end gap-2 rounded-sm py-3 hover:no-underline [&>svg]:mb-0.5">
              <span className="min-w-0 flex-1 space-y-2">
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 flex-wrap items-center gap-2"><span className="font-medium">{kind}</span>{index === 0 && topLabel ? <span className="text-[11px] font-normal text-primary">{topLabel}</span> : selected ? <span className="text-[11px] font-normal text-primary">On map</span> : null}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatRouteDuration(journey.durationSeconds)}</span>
                </span>
                <span aria-label={`Route ${index + 1} lines`} className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  {journey.steps.map((step, stepIndex) => {
                    const color = safeLineColor(step.line?.color) ?? routeColor;
                    const vehicle = getTransitVehicleLabel(step);
                    const LineIcon = TRANSIT_VEHICLE_ICON[vehicle === "Public transit" ? "Other" : vehicle as TransitVehicleKind];
                    return <span key={stepIndex} className="inline-flex max-w-full items-center gap-1.5">
                      {stepIndex ? <ChevronRight className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
                      {step.travelMode === "walk" ? <><Footprints className="size-3.5 text-muted-foreground" aria-hidden="true" /><span className="sr-only">Walk</span></> : <span className="inline-flex max-w-full items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium leading-snug" style={{ backgroundColor: color, color: getLineTextColor(color) }}><LineIcon className="size-3 shrink-0" aria-hidden="true" /><span className="break-words">{step.line?.name || step.line?.shortName || vehicle}</span></span>}
                    </span>;
                  })}
                </span>
                <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-normal leading-relaxed text-muted-foreground">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">{fare ? <span>{fare}</span> : null}{journey.walkingSeconds != null && journey.walkingSeconds > 0 ? <span className="inline-flex items-center gap-1"><Footprints className="size-3" aria-hidden="true" />{formatRouteDuration(journey.walkingSeconds)} walking</span> : null}<span>{transfers ? `${transfers} ${transfers === 1 ? "transfer" : "transfers"}` : "Direct"}</span></span>
                  <span className="text-foreground">Details</span>
                </span>
              </span>
            </AccordionTrigger>
            </div>
            </div>
            <AccordionContent className="pb-3 [&_p]:mb-0">
              <div className="mt-1"><TransitJourney originName={originName} steps={journey.steps} destinationName={destinationName} routeColor={routeColor} insertion={insertion} /></div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
    </RadioGroup>
  );
}
