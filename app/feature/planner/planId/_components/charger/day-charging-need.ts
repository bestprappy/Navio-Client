import { isPlaceItem, type TripBlockData } from "../constants/types";
import type { CanonicalDayProjection } from "../garage/trip-energy-projection";
import { BATTERY_CRITICAL_PCT } from "../garage/garage-formatters";

/**
 * The Battery Threshold triggers charging: every itinerary stop, including the day's final stop, must stay at
 * or above it, while a charger may be reached below it, down to {@link BATTERY_CRITICAL_PCT}. Mirrors Mobility's
 * AutoAddArrivalPolicy for a request without a Minimum Arrival Battery, so the button agrees with the server.
 */
export function requiredArrivalPct(batteryThresholdPct: number, isCharger: boolean): number {
  return isCharger ? Math.min(batteryThresholdPct, BATTERY_CRITICAL_PCT) : batteryThresholdPct;
}

/**
 * True when every routed arrival on the day already meets the threshold, so Auto Add has no slot to fill.
 * Unknown or unrouted legs never count as satisfied.
 */
export function dayHasNoAutoAddSlot(
  day: CanonicalDayProjection | null | undefined,
  block: TripBlockData | undefined,
  batteryThresholdPct: number,
): boolean {
  if (!day) return false;
  const states = [...day.batteryByItemId.entries()];
  if (states.length < 2) return false;
  if (states.some(([, state]) => state.distanceQuality !== "ROUTED" || state.rawPredictedArrivalSocPct == null)) return false;
  const chargerIds = new Set(block?.items.filter(isPlaceItem).filter(item => item.evCharger).map(item => item.id) ?? []);
  return states.slice(1).every(([id, state]) =>
    state.rawPredictedArrivalSocPct! >= requiredArrivalPct(batteryThresholdPct, chargerIds.has(id)));
}

/** The lowest predicted arrival among the day's itinerary stops (chargers excluded), for context next to the threshold. */
export function lowestStopArrivalPct(
  day: CanonicalDayProjection | null | undefined,
  block: TripBlockData | undefined,
): number | null {
  if (!day) return null;
  const chargerIds = new Set(block?.items.filter(isPlaceItem).filter(item => item.evCharger).map(item => item.id) ?? []);
  const arrivals = [...day.batteryByItemId.entries()].slice(1)
    .filter(([id, state]) => !chargerIds.has(id) && state.rawPredictedArrivalSocPct != null)
    .map(([, state]) => state.rawPredictedArrivalSocPct!);
  return arrivals.length ? Math.min(...arrivals) : null;
}
