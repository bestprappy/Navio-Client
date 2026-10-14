"use client";

import type { ReactNode } from "react";
import { ArrowRight, Car, Clock, Footprints, MapPin, Pin, TrainFront, TriangleAlert, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { formatOpeningWindows, formatPlanDuration, formatPlanMinute, formatPlanTravel } from "./auto-plan-format";
import { useAutoPlanContext } from "./auto-plan-context";
import type { AutoPlanMode, DayAutoPlan, PlannedStop } from "./day-auto-plan";

const MODE_ICON: Record<AutoPlanMode, typeof Car> = { drive: Car, transit: TrainFront, walk: Footprints };

function dayRange(plan: DayAutoPlan): { leave: number; finish: number } {
  const first = plan.stops[0];
  const last = plan.stops.at(-1);
  return {
    // Waiting for the first place to open just means leaving later.
    leave: first ? first.start - first.travelMinutes : plan.settings.startMinute,
    finish: last ? last.end + plan.returnMinutes : plan.settings.startMinute,
  };
}

export function AutoPlanSummary() {
  const { plan } = useAutoPlanContext();
  if (!plan?.stops.length) return null;
  const { leave, finish } = dayRange(plan);
  const saving = plan.currentTravelMinutes - plan.travelMinutes;
  const lateCount = plan.stops.filter((stop) => stop.lateMinutes > 0).length;
  const earlyStart = leave < plan.settings.startMinute;
  const lateFinish = finish > plan.settings.endMinute;
  const hasConflict = lateCount > 0 || earlyStart || lateFinish;
  const ModeIcon = MODE_ICON[plan.settings.mode];
  return (
    <section aria-label="Plan summary" className="space-y-4 border-b border-border pb-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Suggested order</h3>
        <span className="text-xs text-muted-foreground">{plan.stops.length} {plan.stops.length === 1 ? "stop" : "stops"}</span>
      </div>
      <div className="space-y-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xl font-semibold tracking-tight tabular-nums">
          <span>{formatPlanMinute(leave)}</span><ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" /><span className="sr-only">to</span><span>{formatPlanMinute(finish)}</span>
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><ModeIcon className="size-3.5 shrink-0" aria-hidden="true" />About {formatPlanDuration(plan.travelMinutes)} of travel <span className="text-muted-foreground">(estimated)</span></p>
        {saving >= 5 ? <p className="text-xs text-success">{formatPlanDuration(saving)} less than your current order</p> : null}
      </div>
      {hasConflict ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/5 p-3" role="status">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">Review the timing</p>
            <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
              {lateCount > 0 ? <li>{lateCount === 1 ? "1 stop is" : `${lateCount} stops are`} late for a fixed time.</li> : null}
              {earlyStart ? <li>Departure is before your {formatPlanMinute(plan.settings.startMinute)} start.</li> : null}
              {lateFinish ? <li>The day finishes after {formatPlanMinute(plan.settings.endMinute)}.</li> : null}
            </ul>
            <p className="pt-1 text-xs leading-relaxed text-foreground">Try another travel mode or adjust your times.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Row({ time, marker, children, line = true }: { time?: ReactNode; marker: ReactNode; children: ReactNode; line?: boolean }) {
  return (
    <div className="grid grid-cols-[3.75rem_1.5rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[4.25rem_1.5rem_minmax(0,1fr)] sm:gap-x-3">
      <div className="pt-0.5 text-right text-xs tabular-nums">{time}</div>
      <div className="flex flex-col items-center">
        {marker}
        {line ? <span className="min-h-2 w-px flex-1 bg-border" /> : null}
      </div>
      <div className="min-w-0 pb-4">{children}</div>
    </div>
  );
}

function TravelRow({ minutes, distanceKm, mode }: { minutes: number; distanceKm: number; mode: AutoPlanMode }) {
  const Icon = distanceKm < 0.5 ? Footprints : MODE_ICON[mode];
  return (
    <Row marker={<span className="h-1" />}>
      <p className="flex items-center gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {formatPlanTravel(minutes, distanceKm, mode)}
      </p>
    </Row>
  );
}

function stopNote(stop: PlannedStop, index: number): string | null {
  if (stop.lateMinutes > 0) return null;
  if (index === 0 || stop.waitMinutes <= 0) return null;
  if (stop.pin === "meal") return `Waits ${formatPlanDuration(stop.waitMinutes)} for ${stop.meal} time`;
  if (stop.pin === "opening") return `Waits ${formatPlanDuration(stop.waitMinutes)} for it to open`;
  return null;
}

function StopRow({ stop, index, isLast }: { stop: PlannedStop; index: number; isLast: boolean }) {
  const note = stopNote(stop, index);
  const hoursUnknown = stop.hours === null;
  return (
    <Row
      line={!isLast}
      time={<><span className={cn("block font-semibold", stop.pin === "yours" ? "text-primary" : "text-foreground")}>{formatPlanMinute(stop.start)}</span><span className="mt-1 block text-muted-foreground">{formatPlanMinute(stop.end)}</span></>}
      marker={<span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground">{index + 1}</span>}
    >
      <p className="break-words text-sm font-semibold leading-snug text-foreground">{stop.name}</p>
      <p className={cn("mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed", hoursUnknown ? "text-warning" : "text-muted-foreground")}>
        <Clock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        {hoursUnknown ? "Hours unknown · check before you go" : formatOpeningWindows(stop.hours)}
      </p>
      {stop.meal || stop.pin === "yours" || stop.lateMinutes > 0 || note ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {stop.meal ? <Badge variant="secondary"><UtensilsCrossed aria-hidden="true" />{stop.meal === "lunch" ? "Lunch" : "Dinner"}</Badge> : null}
          {stop.pin === "yours" ? <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary"><Pin aria-hidden="true" />Fixed time</Badge> : null}
          {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
        </div>
      ) : null}
      {stop.lateMinutes > 0 ? <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-warning"><TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden="true" />Arrives {formatPlanDuration(stop.lateMinutes)} after its fixed time</p> : null}
    </Row>
  );
}

function AnchorRow({ time, label, isLast }: { time: number; label: string; isLast: boolean }) {
  return (
    <Row
      line={!isLast}
      time={<span className="font-medium text-foreground">{formatPlanMinute(time)}</span>}
      marker={<span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground"><MapPin className="size-4" aria-hidden="true" /></span>}
    >
      <p className="break-words text-sm text-foreground">{label}</p>
    </Row>
  );
}

export function AutoPlanTimeline() {
  const { plan, anchors, dayNumber } = useAutoPlanContext();
  if (!plan?.stops.length) return null;
  const { leave, finish } = dayRange(plan);
  const { mode } = plan.settings;
  const hasEnd = anchors.end !== null;
  return (
    <ol aria-label={`Planned order for day ${dayNumber}`}>
      {anchors.start ? <li><AnchorRow time={leave} label={`Leave ${anchors.start.name}`} isLast={false} /></li> : null}
      {plan.stops.map((stop, index) => (
        <li key={stop.itemId}>
          {index > 0 || anchors.start ? <TravelRow minutes={stop.travelMinutes} distanceKm={stop.distanceKm} mode={mode} /> : null}
          <StopRow stop={stop} index={index} isLast={!hasEnd && index === plan.stops.length - 1} />
        </li>
      ))}
      {anchors.end ? (
        <li>
          <TravelRow minutes={plan.returnMinutes} distanceKm={plan.returnDistanceKm} mode={mode} />
          <AnchorRow time={finish} label={`Arrive at ${anchors.end.name}`} isLast />
        </li>
      ) : null}
    </ol>
  );
}

export function AutoPlanLoading() {
  const { isLoading, placeCount } = useAutoPlanContext();
  if (!isLoading) return null;
  return (
    <div className="space-y-3">
      <p role="status" className="text-sm text-muted-foreground">Checking opening hours for {placeCount} places…</p>
      {Array.from({ length: Math.min(4, placeCount) }, (_, index) => (
        <div key={index} className="grid grid-cols-[4.25rem_1.5rem_1fr] items-start gap-x-3">
          <Skeleton className="ml-auto h-4 w-12" />
          <Skeleton className="size-6 rounded-full" />
          <div className="space-y-1.5"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-2/5" /></div>
        </div>
      ))}
    </div>
  );
}
