import { resolveDayAnchors } from "../itinerary/day-anchors";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type EvConnectorType,
  type PlaceItemEvChargerDetails,
  type TripBlockData,
} from "../constants/types";
import type { EvCar } from "../constants/vehicle.types";
import type { RouteSegment } from "../routes/trip-route.types";
import { baselineEnergy, chargeMinutes, chargeTarget, SIMULATION_MODEL } from "./simulation-model";

const DC_CONNECTOR_TYPES = new Set<EvConnectorType>([
  "CCS1",
  "CCS2",
  "CHADEMO",
  "NACS",
  "GB_T",
]);
export const AUTO_MIN_ARRIVAL_PCT = SIMULATION_MODEL.reserveSocPct;
export const AUTO_CHARGE_TARGET_DEFAULT_PCT = 50;
export const AUTO_CHARGE_TARGET_MIN_PCT = 20;
export const AUTO_CHARGE_TARGET_MAX_PCT = 90;

export function isDcCharger(connectorTypes: EvConnectorType[]): boolean {
  return connectorTypes.some((c) => DC_CONNECTOR_TYPES.has(c));
}

export function isCompatible( 
  vehicleConnectors: EvConnectorType[],
  chargerConnectors: EvConnectorType[],
): boolean {
  const vehicleSet = new Set(vehicleConnectors);
  return chargerConnectors.some((c) => vehicleSet.has(c));
}

export function calcEnergyKwh(distanceKm: number, car: EvCar): number {
  return baselineEnergy(distanceKm, car.consumptionKwhPer100km).planningKwh;
}

export function calcBatteryUsedPct(distanceKm: number, car: EvCar): number {
  const energyKwh = calcEnergyKwh(distanceKm, car);
  return (energyKwh / car.batteryKwh) * 100;
}

export function calcBatteryRemainingPct(
  distanceKm: number,
  car: EvCar,
  startPct: number,
): number {
  const usedPct = calcBatteryUsedPct(distanceKm, car);
  return Math.max(0, Math.min(100, startPct - usedPct));
}

export function effectiveChargeKw(
  chargerMaxKw: number,
  car: EvCar,
  isChargerDc: boolean,
): number {
  const vehicleMaxKw = isChargerDc ? car.maxDcKw : car.maxAcKw;
  return Math.min(chargerMaxKw, vehicleMaxKw);
}

export function calcChargeMinutesForEnergyKwh(
  energyKwh: number,
  chargerMaxKw: number,
  car: EvCar,
  connectorTypes: EvConnectorType[],
  arrivalPct = 0,
): number {
  const usable = connectorTypes.filter((connector) => car.connectorTypes.includes(connector));
  if (!usable.length) return 0;
  const effectiveKw = effectiveChargeKw(
    chargerMaxKw,
    car,
    isDcCharger(connectorTypes.filter((connector) => car.connectorTypes.includes(connector))),
  );

  if (effectiveKw <= 0 || energyKwh <= 0) {
    return 0;
  }

  return chargeMinutes(arrivalPct, arrivalPct + energyKwh / car.batteryKwh * 100,
    car.batteryKwh, effectiveKw, isDcCharger(usable));
}

export type ChargingStopProjection = {
  arrivalPct: number;
  departurePct: number;
  chargeEnergyKwh: number;
  chargeMinutes: number;
  compatible: boolean;
};

export function normalizeStationTargetPct(value?: number | null): number {
  return value == null || !Number.isFinite(value) ? 100 : Math.round(clampPct(value));
}

export function projectChargingStop(
  arrivalBatteryPct: number,
  charger: PlaceItemEvChargerDetails,
  car: EvCar,
): ChargingStopProjection {
  const arrivalPct = clampPct(arrivalBatteryPct);
  const compatible = isCompatible(car.connectorTypes, charger.connectorTypes);
  const kw = effectiveChargeKw(charger.maxKw, car, isDcCharger(charger.connectorTypes.filter((connector) => car.connectorTypes.includes(connector))));
  const availableEnergyKwh = ((100 - arrivalPct) / 100) * car.batteryKwh;
  const requestedEnergyKwh = charger.targetBatteryPct == null
    ? (chargeTarget(arrivalPct, Math.max(0, charger.estimatedChargeMinutes), car.batteryKwh, kw,
      isDcCharger(charger.connectorTypes.filter((connector) => car.connectorTypes.includes(connector)))) - arrivalPct) / 100 * car.batteryKwh
    : ((Math.max(arrivalPct, normalizeStationTargetPct(charger.targetBatteryPct)) - arrivalPct) / 100) * car.batteryKwh;
  const chargeEnergyKwh = compatible && kw > 0 && car.batteryKwh > 0
    ? Math.max(0, Math.min(availableEnergyKwh, requestedEnergyKwh))
    : 0;
  return {
    arrivalPct,
    departurePct: car.batteryKwh > 0 ? clampPct(arrivalPct + chargeEnergyKwh / car.batteryKwh * 100) : arrivalPct,
    chargeEnergyKwh,
    chargeMinutes: chargeEnergyKwh > 0 ? calcChargeMinutesForEnergyKwh(chargeEnergyKwh, charger.maxKw, car, charger.connectorTypes, arrivalPct) : 0,
    compatible,
  };
}

/** One stop on a day's drive, in driving order; the first point is where the day starts. */
export type DayBatteryPoint = {
  id: string;
  name: string;
  /** Road distance driven since the start of the day. */
  distanceKm: number;
  arrivalPct: number;
  departurePct: number;
  isCharger: boolean;
};

export type DayEvProjection = {
  startBatteryPct: number;
  finalBatteryPct: number;
  distanceKm: number;
  energyKwh: number;
  chargeEnergyKwh: number;
  chargeMinutes: number;
  compatibleStops: number;
  incompatibleStops: number;
  batteryByItemId: Map<string, ChargingStopProjection>;
  profile: DayBatteryPoint[];
};

export function projectTripCharging(
  blocks: TripBlockData[],
  segments: RouteSegment[],
  car: EvCar,
  startingBatteryPct: number,
): { days: Map<string, DayEvProjection>; summary: TripEvSummary } {
  const days = new Map<string, DayEvProjection>();
  const anchors = resolveDayAnchors(blocks);
  const segmentByItem = new Map(segments.map((segment) => [`${segment.blockId}:${segment.toItemId}`, segment]));
  let currentBatteryPct = clampPct(startingBatteryPct);
  const summary: TripEvSummary = { totalDistanceKm: 0, totalEnergyKwh: 0, totalChargeMinutes: 0, finalBatteryPct: currentBatteryPct, batteryByDay: [] };

  for (const block of blocks.filter((entry) => entry.kind === "itinerary").toSorted((a, b) => a.date.localeCompare(b.date))) {
    const day: DayEvProjection = { startBatteryPct: currentBatteryPct, finalBatteryPct: currentBatteryPct, distanceKm: 0, energyKwh: 0, chargeEnergyKwh: 0, chargeMinutes: 0, compatibleStops: 0, incompatibleStops: 0, batteryByItemId: new Map(), profile: [] };
    const stops = block.items.filter(isPlaceItem).map((item) => ({
      id: item.id,
      name: item.name,
      charger: isEvChargerPlaceItem(item) ? item.evCharger : undefined,
    }));
    const dayAnchors = anchors.get(block.id);
    if (dayAnchors?.start) stops.unshift({ id: `${block.id}:start`, name: dayAnchors.start.name, charger: undefined });
    if (dayAnchors?.end) stops.push({ id: `${block.id}:end`, name: dayAnchors.end.name, charger: undefined });
    for (const item of stops) {
      const segment = segmentByItem.get(`${block.id}:${item.id}`);
      const distanceKm = Math.max(0, segment?.distanceMeters ?? 0) / 1000;
      day.distanceKm += distanceKm;
      day.energyKwh += calcEnergyKwh(distanceKm, car);
      currentBatteryPct = clampPct(currentBatteryPct - calcBatteryUsedPct(distanceKm, car));
      const state: ChargingStopProjection = item.charger
        ? projectChargingStop(currentBatteryPct, item.charger, car)
        : { arrivalPct: currentBatteryPct, departurePct: currentBatteryPct, chargeEnergyKwh: 0, chargeMinutes: 0, compatible: true };
      day.batteryByItemId.set(item.id, state);
      day.profile.push({
        id: item.id, name: item.name, distanceKm: day.distanceKm, arrivalPct: state.arrivalPct,
        departurePct: state.departurePct, isCharger: Boolean(item.charger),
      });
      day.chargeEnergyKwh += state.chargeEnergyKwh;
      day.chargeMinutes += state.chargeMinutes;
      if (item.charger) {
        if (state.compatible) day.compatibleStops += 1;
        else day.incompatibleStops += 1;
      }
      currentBatteryPct = state.departurePct;
    }
    day.finalBatteryPct = currentBatteryPct;
    days.set(block.id, day);
    summary.totalDistanceKm += day.distanceKm;
    summary.totalEnergyKwh += day.energyKwh;
    summary.totalChargeMinutes += day.chargeMinutes;
    summary.batteryByDay.push(Math.round(currentBatteryPct));
  }
  summary.finalBatteryPct = Math.round(currentBatteryPct);
  return { days, summary };
}

export function calcDayRouteStats(
  segments: RouteSegment[],
  car: EvCar,
): {
  totalDistanceKm: number;
  totalDrivingSeconds: number;
  energyKwh: number;
  batteryUsedPct: number;
} {
  let totalDistanceKm = 0;
  let totalDrivingSeconds = 0;

  for (const seg of segments) {
    totalDistanceKm += (seg.distanceMeters ?? 0) / 1000;
    totalDrivingSeconds += seg.durationSeconds ?? 0;
  }

  const energyKwh = calcEnergyKwh(totalDistanceKm, car);
  const batteryUsedPct = calcBatteryUsedPct(totalDistanceKm, car);

  return { totalDistanceKm, totalDrivingSeconds, energyKwh, batteryUsedPct };
}

export type DayChargeStats = {
  chargeMinutes: number;
  chargeEnergyKwh: number;
  compatibleStops: number;
  incompatibleStops: number;
};

export function calcDayChargeStats(
  chargerItems: PlaceItemEvChargerDetails[],
  car: EvCar,
): DayChargeStats {
  let totalMinutes = 0;
  let totalEnergyKwh = 0;
  let compatibleStops = 0;
  let incompatibleStops = 0;

  for (const charger of chargerItems) {
    if (!isCompatible(car.connectorTypes, charger.connectorTypes)) {
      incompatibleStops += 1;
      continue;
    }

    compatibleStops += 1;

    const isChargerDc = isDcCharger(charger.connectorTypes);
    const effectiveKw = effectiveChargeKw(charger.maxKw, car, isChargerDc);
    if (effectiveKw <= 0) continue;

    const chargerEnergyKwh = (charger.estimatedChargeMinutes / 60) * effectiveKw;
    totalMinutes += charger.estimatedChargeMinutes;
    totalEnergyKwh += chargerEnergyKwh;
  }

  return {
    chargeMinutes: totalMinutes,
    chargeEnergyKwh: totalEnergyKwh,
    compatibleStops,
    incompatibleStops,
  };
}

export type DayBlockSummary = {
  distanceKm: number;
  energyKwh: number;
  chargeEnergyKwh: number;
  chargeMinutes: number;
};

export type TripEvSummary = {
  totalDistanceKm: number;
  totalEnergyKwh: number;
  totalChargeMinutes: number;
  finalBatteryPct: number;
  batteryByDay: number[];
};

export function calcTripEvSummary(
  blockSummaries: DayBlockSummary[],
  car: EvCar,
  startingBatteryPct: number,
): TripEvSummary {
  let totalDistanceKm = 0;
  let totalEnergyKwh = 0;
  let totalChargeMinutes = 0;
  let currentBatteryPct = startingBatteryPct;
  const batteryByDay: number[] = [];

  for (const day of blockSummaries) {
    totalDistanceKm += day.distanceKm;
    totalEnergyKwh += day.energyKwh;
    totalChargeMinutes += day.chargeMinutes;

    const consumedPct = (day.energyKwh / car.batteryKwh) * 100;
    const chargedPct = (day.chargeEnergyKwh / car.batteryKwh) * 100;
    currentBatteryPct = Math.max(0, Math.min(100, currentBatteryPct - consumedPct + chargedPct));
    batteryByDay.push(Math.round(currentBatteryPct));
  }

  return {
    totalDistanceKm,
    totalEnergyKwh,
    totalChargeMinutes,
    finalBatteryPct: Math.round(currentBatteryPct),
    batteryByDay,
  };
}

export function normalizeChargeTargetPct(value?: number): number {
  return Math.round(
    clampNumber(
      value ?? AUTO_CHARGE_TARGET_DEFAULT_PCT,
      AUTO_CHARGE_TARGET_MIN_PCT,
      AUTO_CHARGE_TARGET_MAX_PCT,
    ),
  );
}

export function calcRangeKmForBatteryPct(batteryPct: number, car: EvCar): number {
  const energyKwh = (clampPct(batteryPct) / 100) * car.batteryKwh;
  return (energyKwh / (car.consumptionKwhPer100km * (1 + SIMULATION_MODEL.planningMarginFraction))) * 100;
}

function clampPct(value: number): number {
  return clampNumber(value, 0, 100);
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}
