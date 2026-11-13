import { z } from "zod";

/** What the panel reads and works out. No fetching or rendering here, so every rule can be tested. */

export const googleUsageSchema = z.object({
  monthStart: z.string(),
  resetsAt: z.string(),
  asOf: z.string(),
  limitsEnforced: z.boolean(),
  placesDiscoveryEnabled: z.boolean(),
  meters: z.array(z.object({
    meter: z.string(),
    used: z.number().int().nonnegative(),
    limit: z.number().int().nonnegative(),
    lastCountedAt: z.string().nullable(),
  })),
});

export type GoogleUsageReport = z.infer<typeof googleUsageSchema>;
export type GoogleUsageMeter = GoogleUsageReport["meters"][number];
export type MeterState = "reached" | "nearly" | "fast" | "ok";

const NEARLY_USED_PERCENT = 80;
const DAY_MS = 86_400_000;

/** `limitEffect` finishes the sentence "At the limit, ...". */
const METER_COPY: Record<string, { name: string; limitEffect: string }> = {
  PLACE_PHOTOS: { name: "Place photos", limitEffect: "places show without photos" },
  PLACE_DETAILS: { name: "Place details", limitEffect: "hours and ratings stop loading on new lookups" },
  PLACES_TEXT_SEARCH: { name: "Place search", limitEffect: "searching for new places stops" },
  PLACES_NEARBY_SEARCH: { name: "Nearby and charger search", limitEffect: "nearby places and charger search stop" },
  PLACES_AUTOCOMPLETE: { name: "Search suggestions", limitEffect: "suggestions stop while typing" },
  ROUTES: { name: "Routes", limitEffect: "new route calculations stop" },
};

/** A meter the server added after this page shipped still shows, under a readable name. */
export function meterCopy(meter: string): { name: string; limitEffect: string } {
  const known = METER_COPY[meter];
  if (known) return known;
  const words = meter.replaceAll("_", " ").toLowerCase();
  return { name: words.charAt(0).toUpperCase() + words.slice(1), limitEffect: "these Google calls stop" };
}

export function usagePercent({ used, limit }: Pick<GoogleUsageMeter, "used" | "limit">): number {
  if (limit <= 0) return 100;
  return Math.min(100, (used / limit) * 100);
}

/** How far through the billing month the report was taken, 0 to 100. */
export function monthPercent(report: Pick<GoogleUsageReport, "monthStart" | "resetsAt" | "asOf">): number {
  const start = Date.parse(report.monthStart);
  const end = Date.parse(report.resetsAt);
  const now = Date.parse(report.asOf);
  if (![start, end, now].every(Number.isFinite) || end <= start) return 0;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

/**
 * When the meter runs out at this month's pace, or null if it lasts until the reset.
 * Stays quiet for the first day, when one busy hour would predict nonsense.
 */
export function projectedRunOut(
  meter: Pick<GoogleUsageMeter, "used" | "limit">,
  report: Pick<GoogleUsageReport, "monthStart" | "resetsAt" | "asOf">,
): Date | null {
  const start = Date.parse(report.monthStart);
  const end = Date.parse(report.resetsAt);
  const elapsed = Date.parse(report.asOf) - start;
  if (!Number.isFinite(elapsed) || elapsed < DAY_MS || meter.used <= 0 || meter.used >= meter.limit) return null;
  const runOut = start + (meter.limit / meter.used) * elapsed;
  return runOut < end ? new Date(runOut) : null;
}

export function meterState(
  meter: Pick<GoogleUsageMeter, "used" | "limit">,
  report: Pick<GoogleUsageReport, "monthStart" | "resetsAt" | "asOf">,
): MeterState {
  if (meter.used >= meter.limit) return "reached";
  if (usagePercent(meter) >= NEARLY_USED_PERCENT) return "nearly";
  return projectedRunOut(meter, report) ? "fast" : "ok";
}

/** Fullest first, so whatever needs attention is at the top. */
export function metersByUrgency(meters: readonly GoogleUsageMeter[]): GoogleUsageMeter[] {
  return [...meters].sort((a, b) => usagePercent(b) - usagePercent(a));
}

const count = (value: number) => new Intl.NumberFormat("en").format(value);

/** The page's one-line answer to "are we all right?". */
export function summarize(meters: readonly GoogleUsageMeter[], limitsEnforced = true): string {
  // With limits off nothing stops, and the budget stops counting too, so no meter reading holds.
  if (!limitsEnforced) return "Google calls are not being counted right now.";
  const reached = meters.filter((meter) => meter.used >= meter.limit);
  if (reached.length > 1) return `${reached.length} limits have been reached this month.`;
  if (reached.length === 1) {
    const { name, limitEffect } = meterCopy(reached[0].meter);
    return `${name} has reached its limit, so ${limitEffect}.`;
  }
  const fullest = metersByUrgency(meters)[0];
  if (!fullest || fullest.used === 0) return "No Google calls have been counted this month.";
  return `${meterCopy(fullest.meter).name} is closest to its limit, at ${count(fullest.used)} of ${count(fullest.limit)}.`;
}
