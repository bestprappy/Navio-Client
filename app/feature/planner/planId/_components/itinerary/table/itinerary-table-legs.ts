import type { LegTravelMode } from "../../constants/types";
import { getTransitVehicleLabel } from "../../routes/travel-options";
import type { RouteSegment, RouteStep } from "../../routes/trip-route.types";
import type { ItineraryTableRow } from "../export/itinerary-table";

/** One ride on a transit line within a leg, such as Bus 23 or the Blue Line. */
export type TableRide = {
  /** The line as riders know it: its short name when published, otherwise its full name. */
  line: string;
  /** "Bus", "Metro", "Train" and so on. */
  vehicle: string;
  /** Operator colour as `#rrggbb`, when published. */
  color: string | null;
  from: string | null;
  to: string | null;
  stopCount: number | null;
  headsign: string | null;
};

/** How a stop is reached from the one before it, as the table shows it. */
export type TableLeg = {
  mode: LegTravelMode;
  /** `unverified` when the route could not be confirmed and only a straight line is known. */
  status: "routed" | "unverified";
  durationSeconds: number | null;
  distanceMeters: number | null;
  /** Transit rides in order; empty for other modes. */
  rides: TableRide[];
  /** Time on foot within a transit leg, or null when there is none. */
  walkingSeconds: number | null;
  /** True when the saved transit route was not offered and the closest current one is shown. */
  savedRouteUnavailable: boolean;
};

export type DayTravelShare = {
  mode: LegTravelMode;
  seconds: number;
  /** Fraction of the day's routed travel time, from 0 to 1. */
  share: number;
};

export type DayTravelSummary = {
  totalSeconds: number;
  /** Modes in order of time spent, longest first. */
  modes: DayTravelShare[];
  unverifiedCount: number;
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}){1,2}$/i;

function positive(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function toRide(step: RouteStep): TableRide {
  const line = step.line;
  return {
    line: line?.shortName?.trim() || line?.name?.trim() || getTransitVehicleLabel(step),
    vehicle: getTransitVehicleLabel(step),
    color: line?.color && HEX_COLOR.test(line.color) ? line.color : null,
    from: step.departureStop?.trim() || null,
    to: step.arrivalStop?.trim() || null,
    stopCount: positive(step.stopCount),
    headsign: step.headsign?.trim() || null,
  };
}

function toLeg(segment: RouteSegment): TableLeg {
  const routed = segment.status === "routed";
  const steps = routed ? segment.steps ?? [] : [];
  const walkingSeconds = steps
    .filter((step) => step.travelMode === "walk")
    .reduce((sum, step) => sum + (positive(step.durationSeconds) ?? 0), 0);
  const rides = steps.filter((step) => step.travelMode === "transit").map(toRide);
  return {
    mode: segment.travelMode ?? "drive",
    status: routed ? "routed" : "unverified",
    durationSeconds: routed ? positive(segment.durationSeconds) : null,
    distanceMeters: positive(segment.distanceMeters),
    rides,
    walkingSeconds: rides.length && walkingSeconds ? walkingSeconds : null,
    savedRouteUnavailable: Boolean(segment.savedRouteUnavailable),
  };
}

/** The leg arriving at each stop, keyed by the stop's row ID. */
export function getArrivalLegs(segments: readonly RouteSegment[]): Map<string, TableLeg> {
  return new Map(segments.map((segment) => [segment.toItemId, toLeg(segment)]));
}

/** Total routed travel for a day and how it splits between travel modes. */
export function summarizeDayTravel(legs: readonly (TableLeg | undefined)[]): DayTravelSummary {
  const secondsByMode = new Map<LegTravelMode, number>();
  let unverifiedCount = 0;
  for (const leg of legs) {
    if (!leg) continue;
    if (leg.status === "unverified") {
      unverifiedCount += 1;
      continue;
    }
    if (leg.durationSeconds) {
      secondsByMode.set(leg.mode, (secondsByMode.get(leg.mode) ?? 0) + leg.durationSeconds);
    }
  }
  const totalSeconds = [...secondsByMode.values()].reduce((sum, seconds) => sum + seconds, 0);
  const modes = [...secondsByMode]
    .map(([mode, seconds]) => ({ mode, seconds, share: totalSeconds ? seconds / totalSeconds : 0 }))
    .toSorted((a, b) => b.seconds - a.seconds);
  return { totalSeconds, modes, unverifiedCount };
}

/**
 * Minutes a stop would be reached after its planned start: the stop before it ends,
 * then the routed travel time passes. Only worked out when both stops have times and
 * the leg between them is routed, so an unknown is never reported as late.
 */
export function getLateArrivals(
  rows: readonly ItineraryTableRow[],
  legs: ReadonlyMap<string, TableLeg>,
): Map<string, number> {
  const late = new Map<string, number>();
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    const leg = legs.get(row.id);
    const leaves = previous?.endMinute ?? previous?.startMinute;
    if (row.startMinute === null || leaves == null || !leg?.durationSeconds || leg.status !== "routed") return;
    const arrives = leaves + Math.ceil(leg.durationSeconds / 60);
    if (arrives > row.startMinute) late.set(row.id, arrives - row.startMinute);
  });
  return late;
}

/** "45 min", "1 hr", "1 hr 15 min". */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

/** How long the traveller stays at a stop, or null without both times. */
export function getStayMinutes(row: Pick<ItineraryTableRow, "startMinute" | "endMinute">): number | null {
  if (row.startMinute === null || row.endMinute === null) return null;
  const minutes = row.endMinute - row.startMinute;
  return minutes > 0 ? minutes : null;
}
