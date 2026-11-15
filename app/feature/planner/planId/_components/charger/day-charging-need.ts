import { isPlaceItem, type TripBlockData } from "../constants/types";
import type { CanonicalDayProjection } from "../garage/trip-energy-projection";

export type ChargingPreferences = { batteryThresholdPct: number; minimumArrivalPct: number };

/**
 * The Battery Threshold triggers charging: itinerary stops must stay at or above it, while a charger may be
 * reached below it, down to the lower of the two preferences. The day's final stop only needs the Minimum
 * Arrival Battery. Mirrors Mobility's AutoAddArrivalPolicy so the button agrees with the server.
 */
export function requiredArrivalPct(prefs: ChargingPreferences, isCharger: boolean, isFinal: boolean): number {
  if (isFinal) return prefs.minimumArrivalPct;
  return isCharger ? Math.min(prefs.batteryThresholdPct, prefs.minimumArrivalPct) : prefs.batteryThresholdPct;
}

/**
 * True when every routed arrival on the day already meets the preferences, so Auto Add has no slot to fill.
 * Unknown or unrouted legs never count as satisfied.
 */
export function dayHasNoAutoAddSlot(
  day: CanonicalDayProjection | null | undefined,
  block: TripBlockData | undefined,
  prefs: ChargingPreferences,
): boolean {
  if (!day) return false;
  const states = [...day.batteryByItemId.entries()];
  if (states.length < 2) return false;
  if (states.some(([, state]) => state.distanceQuality !== "ROUTED" || state.rawPredictedArrivalSocPct == null)) return false;
  const chargerIds = new Set(block?.items.filter(isPlaceItem).filter(item => item.evCharger).map(item => item.id) ?? []);
  return states.slice(1).every(([id, state], index, arrivals) =>
    state.rawPredictedArrivalSocPct! >= requiredArrivalPct(prefs, chargerIds.has(id), index === arrivals.length - 1));
}
