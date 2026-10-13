"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, ExternalLink, Loader2, RotateCw } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LegTravelMode } from "../constants/types";
import { plannerReadOnlyAtom, updatePlaceItemAtom } from "../overview/trip-builder.atoms";
import { isTransitMode, LEG_TRAVEL_MODES } from "./leg-travel-mode";
import { LEG_TRAVEL_MODE_META } from "./leg-travel-mode-meta";
import { RouteSegmentInfo } from "./route-segment-info";
import { formatRouteDuration } from "./trip-route.helpers";
import type { RoutePoint, RouteSegment } from "./trip-route.types";
import { getTransitRouteKey } from "./transit-route-choice";
import { getLegDirectionsUrl, matchesTransitPreference, getTravelOptionPreview, isUsableTravelOption, type TravelOptionKey } from "./travel-options";
import { TransitJourney } from "./transit-journey";
import { TransitJourneyList } from "./transit-journey-list";
import { TransitJourneyToolbar } from "./transit-journey-toolbar";
import { canSortByFare, filterTransitJourneys, getAvailableVehicleKinds, sortTransitJourneys, TRANSIT_JOURNEY_SORTS,
  type TransitVehicleKind } from "./transit-journey-filters";
import { transitJourneySortAtom, transitRoutePreviewAtom } from "./route-preview.atoms";
import type { TransitJourney as TransitJourneyData } from "./trip-route.types";
import { useTravelOptions } from "./use-travel-options";

const NO_JOURNEYS: TransitJourneyData[] = [];

export function RouteJourneyOptions({ blockId, from, to, segment, plannedMode, automaticRail, routeColor, isLoading, isError, trailing }: {
  blockId: string; from: RoutePoint; to: RoutePoint; segment: RouteSegment | null;
  plannedMode: LegTravelMode; automaticRail: boolean; routeColor: string;
  isLoading: boolean; isError: boolean; trailing?: ReactNode;
}) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [previewKey, setPreviewKey] = useState<TravelOptionKey | null>(null);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [vehicleKind, setVehicleKind] = useState<TransitVehicleKind | null>(null);
  const [sort, setSort] = useAtom(transitJourneySortAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const updatePlace = useSetAtom(updatePlaceItemAtom);
  const setMapPreview = useSetAtom(transitRoutePreviewAtom);
  const options = useTravelOptions(blockId, from, to, expanded);
  const plannedKey: TravelOptionKey = automaticRail && plannedMode === "transit" ? "rail" : plannedMode;
  const selectedKey = previewKey ?? plannedKey;
  const selectedMode = isTransitMode(selectedKey) ? "transit" : selectedKey;
  // Every rail, bus and mixed journey is merged into "transit"; vehicle filters narrow it client-side.
  const preview = options.data?.find((option) => option.key === selectedMode)
    ?? { key: selectedMode, segment: selectedKey === plannedKey ? segment : null };
  const usable = !options.isPending && isUsableTravelOption(preview);
  const allJourneys = usable ? preview.segment?.journeys ?? NO_JOURNEYS : NO_JOURNEYS;
  const vehicleKinds = getAvailableVehicleKinds(allJourneys);
  const activeKind = vehicleKinds.some(item => item.kind === vehicleKind) ? vehicleKind : null;
  const fareSortable = canSortByFare(allJourneys);
  const activeSort = sort === "lowest-fare" && !fareSortable ? "fastest" : sort;
  const journeys = sortTransitJourneys(filterTransitJourneys(allJourneys, activeKind), activeSort);
  const plannedPreference = selectedKey === plannedKey && (plannedKey === "rail" || plannedKey === "bus") ? plannedKey : null;
  const journey = journeys.find(item => item.id === journeyId)
    ?? (selectedKey === plannedKey ? journeys.find(item => getTransitRouteKey(item.steps) === to.arrivalRouteKey) : undefined)
    ?? (plannedPreference ? journeys.find(item => matchesTransitPreference(item.steps, plannedPreference)) : undefined)
    ?? journeys[0];
  const leader = journeys[0];
  const topLabel = activeSort === "lowest-fare" && leader?.fare == null ? undefined
    : TRANSIT_JOURNEY_SORTS.find(item => item.value === activeSort)?.label;
  const chosenRouteKey = journey ? getTransitRouteKey(journey.steps) : null;
  const chosenMode = journey ? matchesTransitPreference(journey.steps, "rail") ? "rail"
    : matchesTransitPreference(journey.steps, "bus") ? "bus" : "transit" : selectedKey;
  const inPlan = journey ? chosenRouteKey != null && chosenRouteKey === to.arrivalRouteKey
    : selectedKey === plannedKey;
  const hasTransitSteps = usable && preview.segment?.steps?.some((step) => step.travelMode === "transit");
  const { label: modeLabel, Icon: ModeIcon } = LEG_TRAVEL_MODE_META[plannedMode];
  const insertion = readOnly ? undefined : { blockId, beforeItemId: to.id };

  useEffect(() => {
    if (expanded) setMapPreview(usable
      ? getTravelOptionPreview({ key: selectedMode, segment: preview.segment }, journey?.id)
      : preview.segment?.status === "fallback" ? preview.segment : null);
    return () => setMapPreview((current) => current?.blockId === blockId && current.toItemId === to.id ? null : current);
  }, [expanded, usable, journey?.id, preview.segment, selectedMode, blockId, to.id, setMapPreview]);

  function setMode(key: TravelOptionKey) {
    setPreviewKey(key);
    setJourneyId(null);
  }

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <RouteSegmentInfo segment={segment} isLoading={isLoading} isError={isError} routeColor={routeColor} plannedMode={plannedMode}
          modeControl={<Button type="button" variant="ghost" size="sm" data-no-drag aria-label={`Travel mode: ${modeLabel}. Show routes`} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded((current) => !current)} className="-ml-1.5 inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ModeIcon className="size-4" style={{ color: routeColor }} aria-hidden="true" /><ChevronDown className={cn("size-3 text-muted-foreground transition-transform motion-reduce:transition-none", expanded && "rotate-180")} aria-hidden="true" /></Button>}
        />
        {trailing}
      </div>
      {expanded ? <section id={panelId} aria-label={`Routes from ${from.name} to ${to.name}`} className="mt-2 space-y-4 rounded-lg border border-border bg-card px-3 py-3 sm:px-4">
        <div role="group" aria-label="Compare travel modes" className="grid grid-cols-4 gap-1 rounded-md bg-muted/60 p-1">
          {LEG_TRAVEL_MODES.map((mode) => {
            const meta = LEG_TRAVEL_MODE_META[mode];
            const active = mode === selectedMode;
            const choice = active ? preview : options.data?.find(option => option.key === mode);
            const duration = active && journey ? journey.durationSeconds
              : (choice?.segment?.journeys?.length ? sortTransitJourneys(choice.segment.journeys, "fastest")[0].durationSeconds : null)
                ?? choice?.segment?.durationSeconds;
            return <Button key={mode} type="button" variant="ghost" aria-pressed={active} onClick={() => setMode(mode)} className={cn("h-auto flex min-w-0 flex-col items-center gap-1 rounded-sm px-1 py-2 text-xs leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground hover:bg-card/60 hover:text-foreground")}>
              <meta.Icon className="size-4" aria-hidden="true" /><span className="font-medium">{mode === "transit" ? "Transit" : meta.label}</span>
              <span className={cn("text-[11px] tabular-nums", active ? "text-primary" : "text-muted-foreground")}>{options.isPending ? "Checking…" : isUsableTravelOption(choice) ? duration ? formatRouteDuration(duration) : "Time unknown" : "Unverified"}</span>
            </Button>;
          })}
        </div>
        <p className="break-words text-xs leading-relaxed text-muted-foreground">{from.name}<span aria-hidden="true"> → </span><span className="sr-only"> to </span>{to.name}</p>
        {options.isPending ? <p role="status" className="flex items-center gap-2 py-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Checking routes for this journey…</p> : <div className="space-y-3">
          {allJourneys.length ? <TransitJourneyToolbar kinds={vehicleKinds} totalCount={allJourneys.length} visibleCount={journeys.length}
            activeKind={activeKind} onKindChange={setVehicleKind} sort={activeSort} onSortChange={setSort} fareSortable={fareSortable} /> : null}
          {journeys.length ? <TransitJourneyList journeys={journeys} selectedId={journey?.id ?? null} onSelect={setJourneyId} routeColor={routeColor} originName={from.name} destinationName={to.name} insertion={insertion} topLabel={topLabel} /> : <>
            <RouteSegmentInfo segment={preview.segment} plannedMode={selectedKey} routeColor={routeColor} isError={options.isError} isLoading={false} />
            {hasTransitSteps ? <><TransitJourney steps={preview.segment?.steps ?? []} originName={from.name} destinationName={to.name} routeColor={routeColor} insertion={insertion} /><p className="text-xs leading-relaxed text-muted-foreground">Walking and riding time only. Schedules and waiting time are unavailable.</p></> : usable && selectedMode === "transit" ? <p className="text-xs text-muted-foreground">Station details are unavailable for this route.</p> : !usable ? <p className="text-xs leading-relaxed text-muted-foreground">A route has not been confirmed. Transit coverage depends on local data availability. Check Google Maps or choose another mode.</p> : null}
          </>}
        </div>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <a href={getLegDirectionsUrl(from, to, selectedMode)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Google Maps<ExternalLink className="size-3" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          <div className="flex items-center gap-2">
            {!usable && !options.isPending ? <Button type="button" variant="ghost" size="xs" disabled={options.isFetching} onClick={() => void options.refetch()} aria-label="Check routes again"><RotateCw className={cn("size-3.5", options.isFetching && "animate-spin")} aria-hidden="true" />Retry</Button> : null}
            {!readOnly && usable ? <Button type="button" size="xs" variant={inPlan ? "secondary" : "default"} disabled={inPlan || (Boolean(journey) && !chosenRouteKey)} onClick={() => updatePlace({ blockId, itemId: to.id, updates: { arrivalMode: chosenMode, arrivalRouteKey: chosenRouteKey } })}>{inPlan ? <><Check className="size-3.5" aria-hidden="true" />In plan</> : journey ? "Use this route" : `Use ${selectedKey === "transit" ? "public transit" : selectedKey === "rail" ? "rail" : LEG_TRAVEL_MODE_META[selectedKey].label.toLowerCase()}`}</Button> : null}
          </div>
        </div>
      </section> : null}
    </div>
  );
}
