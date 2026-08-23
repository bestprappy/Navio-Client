import type { TripResponse } from "../planner-api";

export type TripStatus = "ongoing" | "upcoming" | "past";

const MS_PER_DAY = 86_400_000;

/**
 * Parses a `YYYY-MM-DD` API date as a local calendar day so that timezone
 * offsets never shift a trip by one day. Returns null for malformed input.
 */
export function parseTripDate(value: string | null | undefined): Date | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getTripStatus(trip: TripResponse, today = startOfToday()): TripStatus {
  const start = parseTripDate(trip.startDate);
  const end = parseTripDate(trip.endDate) ?? start;
  if (!start || !end) return "upcoming";
  if (today.getTime() < start.getTime()) return "upcoming";
  if (today.getTime() > end.getTime()) return "past";
  return "ongoing";
}

/** Inclusive day count between start and end, minimum 1. */
export function getTripDayCount(trip: TripResponse): number {
  const start = parseTripDate(trip.startDate);
  const end = parseTripDate(trip.endDate) ?? start;
  if (!start || !end) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  return Math.max(1, diff + 1);
}

/** Whole days from today until the trip starts. Negative once it has started. */
export function getDaysUntilStart(
  trip: TripResponse,
  today = startOfToday(),
): number {
  const start = parseTripDate(trip.startDate);
  if (!start) return 0;
  return Math.round((start.getTime() - today.getTime()) / MS_PER_DAY);
}

export function formatTripDateRange(trip: TripResponse): string {
  const start = parseTripDate(trip.startDate);
  const end = parseTripDate(trip.endDate) ?? start;
  if (!start || !end) return "Dates not set";

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameDay = start.getTime() === end.getTime();
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return sameDay ? endLabel : `${startLabel} – ${endLabel}`;
}

export function formatCountdown(trip: TripResponse, status: TripStatus): string {
  if (status === "past") return "Trip completed";
  if (status === "ongoing") return "Happening now";
  const days = getDaysUntilStart(trip);
  if (days <= 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

/**
 * Chooses the trip to feature: an ongoing trip first, then the soonest
 * upcoming trip, then the most recently updated one.
 */
export function selectCurrentTrip(
  trips: readonly TripResponse[],
  today = startOfToday(),
): TripResponse | null {
  if (trips.length === 0) return null;

  const ongoing = trips
    .filter((trip) => getTripStatus(trip, today) === "ongoing")
    .sort(byStartDateAsc);
  if (ongoing.length > 0) return ongoing[0];

  const upcoming = trips
    .filter((trip) => getTripStatus(trip, today) === "upcoming")
    .sort(byStartDateAsc);
  if (upcoming.length > 0) return upcoming[0];

  return [...trips].sort(byUpdatedAtDesc)[0] ?? null;
}

/** Remaining trips, ordered by upcoming first then most recently updated. */
export function sortTrips(
  trips: readonly TripResponse[],
  today = startOfToday(),
): TripResponse[] {
  const rank: Record<TripStatus, number> = { ongoing: 0, upcoming: 1, past: 2 };
  return [...trips].sort((left, right) => {
    const statusDiff =
      rank[getTripStatus(left, today)] - rank[getTripStatus(right, today)];
    if (statusDiff !== 0) return statusDiff;
    return byStartDateAsc(left, right);
  });
}

/** Deep-links into the planner with the context the detail page expects. */
export function buildTripHref(trip: TripResponse): string {
  const searchParams = new URLSearchParams({
    destinationId: trip.destinationId,
    destinationName: trip.destinationName,
  });

  const start = parseTripDate(trip.startDate);
  const end = parseTripDate(trip.endDate);
  if (start) searchParams.set("from", start.toISOString());
  if (end) searchParams.set("to", end.toISOString());
  if (trip.destinationLat !== null) {
    searchParams.set("lat", String(trip.destinationLat));
  }
  if (trip.destinationLng !== null) {
    searchParams.set("lng", String(trip.destinationLng));
  }

  return `/planner/${trip.id}?${searchParams.toString()}`;
}

export function getTripLocationLabel(trip: TripResponse): string {
  return [trip.destinationName, trip.destinationCountry]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function byStartDateAsc(left: TripResponse, right: TripResponse): number {
  const leftStart = parseTripDate(left.startDate)?.getTime() ?? 0;
  const rightStart = parseTripDate(right.startDate)?.getTime() ?? 0;
  return leftStart - rightStart;
}

function byUpdatedAtDesc(left: TripResponse, right: TripResponse): number {
  const leftUpdated = Date.parse(left.updatedAt);
  const rightUpdated = Date.parse(right.updatedAt);
  return (
    (Number.isNaN(rightUpdated) ? 0 : rightUpdated) -
    (Number.isNaN(leftUpdated) ? 0 : leftUpdated)
  );
}
