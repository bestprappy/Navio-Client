"use client";

import { BusFront, Footprints, Ship, TrainFront } from "lucide-react";

import { AddTransitStop } from "./add-transit-stop";
import { formatRouteDistance, formatRouteDuration, safeLineColor } from "./trip-route.helpers";
import type { RouteStep } from "./trip-route.types";
import { getLineTextColor, getTransitVehicleLabel, matchesTransitPreference } from "./travel-options";
import { getWalkInstruction } from "./transit-journey.helpers";

export function TransitJourney({ steps, routeColor, insertion, originName, destinationName }: {
  steps: RouteStep[]; routeColor: string; originName?: string; destinationName?: string; insertion?: { blockId: string; beforeItemId: string };
}) {
  return (
    <ol aria-label="Journey directions">
      {originName ? <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3">
        <span className="flex flex-col items-center pt-1" aria-hidden="true"><span className="size-2.5 rounded-full border-2 border-foreground" /><span className="mt-1 min-h-3 flex-1 border-l-2 border-dotted" style={{ borderColor: routeColor }} /></span>
        <span className="pb-3 text-sm font-medium leading-snug">{originName}</span>
      </li> : null}
      {steps.map((step, index) => {
        if (step.travelMode !== "transit") {
          return (
            <li key={index} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 text-xs leading-relaxed text-muted-foreground">
              <span className="mx-auto h-full border-l-2 border-dotted" style={{ borderColor: routeColor }} aria-hidden="true" />
              <span className="flex items-start gap-2 py-3"><Footprints className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><span className="block font-medium text-foreground">{getWalkInstruction(steps, index, destinationName)}</span><span className="block">{step.durationSeconds != null && step.durationSeconds > 0 ? formatRouteDuration(step.durationSeconds) : "Walking time unavailable"}{step.distanceMeters != null && step.distanceMeters > 0 ? ` (${formatRouteDistance(step.distanceMeters)})` : ""}</span></span></span>
            </li>
          );
        }
        const label = getTransitVehicleLabel(step);
        const Icon = label === "Bus" ? BusFront : label === "Ferry" ? Ship : TrainFront;
        const color = safeLineColor(step.line?.color) ?? routeColor;
        const lineName = step.line?.name || step.line?.shortName || label;
        const isTransfer = steps.slice(0, index).some((previous) => previous.travelMode === "transit");
        return (
          <li key={index} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3">
            <div className="flex flex-col items-center py-1" aria-hidden="true">
              <span className="size-2.5 rounded-full border-2" style={{ borderColor: color }} />
              <span className="my-1 min-h-12 w-0.5 flex-1 rounded-full" style={{ backgroundColor: color }} />
              <span className="size-2.5 rounded-full border-2" style={{ borderColor: color }} />
            </div>
            <div className="min-w-0 space-y-2 pb-3">
              <div className="flex min-h-6 items-center justify-between gap-2">
                <span className="min-w-0 text-sm font-medium leading-snug"><span className="mb-0.5 block text-[11px] font-normal text-muted-foreground">{isTransfer ? "Transfer at" : "Board at"}</span>{step.departureStop || "Boarding station unavailable"}</span>
                {insertion && step.departureStop ? <AddTransitStop {...insertion} name={step.departureStop} coordinate={step.departureLocation ?? step.geometry.coordinates[0]} arrivalMode="walk" /> : null}
              </div>
              <div className="space-y-1 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-semibold leading-snug" style={{ backgroundColor: color, color: getLineTextColor(color) }}>
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" /><span className="break-words">{lineName}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step.stopCount != null ? `${step.stopCount} ${step.stopCount === 1 ? "stop" : "stops"}` : "Stop count unavailable"}
                  {step.durationSeconds != null && step.durationSeconds > 0 ? ` · ${formatRouteDuration(step.durationSeconds)}` : ""}
                </p>
                {step.headsign ? <p className="text-xs leading-relaxed text-muted-foreground">Towards {step.headsign}</p> : null}
              </div>
              <div className="flex min-h-6 items-center justify-between gap-2">
                <span className="min-w-0 text-sm font-medium leading-snug"><span className="mb-0.5 block text-[11px] font-normal text-muted-foreground">Get off at</span>{step.arrivalStop || "Arrival station unavailable"}</span>
                {insertion && step.arrivalStop ? <AddTransitStop {...insertion} name={step.arrivalStop} coordinate={step.arrivalLocation ?? step.geometry.coordinates.at(-1)} arrivalMode={matchesTransitPreference([step], "rail") ? "rail" : matchesTransitPreference([step], "bus") ? "bus" : "transit"} /> : null}
              </div>
            </div>
          </li>
        );
      })}
      {destinationName ? <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 pt-1">
        <span className="mx-auto mt-1 size-2.5 rounded-full border-2 border-foreground" aria-hidden="true" /><span className="text-sm font-medium leading-snug">{destinationName}</span>
      </li> : null}
    </ol>
  );
}
