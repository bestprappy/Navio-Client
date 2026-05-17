import { getDistanceKm } from "../constants/place.data";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type EvCharger,
  type EvConnectorType,
  type PlaceItem,
  type PlaceItemEvChargerDetails,
  type TripBlockData,
} from "../constants/types";
import type { EvCar } from "../constants/vehicle.types";
import type { RouteSegment } from "../routes/trip-route.types";

const DC_CONNECTOR_TYPES = new Set<EvConnectorType>([
  "CCS1",
  "CCS2",
  "CHADEMO",
  "NACS",
  "GB_T",
]);
const AUTO_MIN_ARRIVAL_PCT = 12;
const AUTO_COMFORT_ARRIVAL_PCT = 24;
export const AUTO_CHARGE_TARGET_DEFAULT_PCT = 50;
export const AUTO_CHARGE_TARGET_MIN_PCT = 20;
export const AUTO_CHARGE_TARGET_MAX_PCT = 90;
const AUTO_MAX_CHARGE_TARGET_PCT = 92;
const AUTO_HEAVY_LEG_PCT = 35;
const AUTO_ABSOLUTE_MIN_ARRIVAL_PCT = 5;
const MAX_AUTO_INSERTIONS_PER_LEG = 3;

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
  return (distanceKm * car.consumptionKwhPer100km) / 100;
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
  const vehicleMaxKw = isChargerDc && car.maxDcKw > 0 ? car.maxDcKw : car.maxAcKw;
  return Math.min(chargerMaxKw, vehicleMaxKw);
}

export function calcChargeMinutesForEnergyKwh(
  energyKwh: number,
  chargerMaxKw: number,
  car: EvCar,
  connectorTypes: EvConnectorType[],
): number {
  const effectiveKw = effectiveChargeKw(
    chargerMaxKw,
    car,
    isDcCharger(connectorTypes),
  );

  if (effectiveKw <= 0 || energyKwh <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil((energyKwh / effectiveKw) * 60));
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

type Coordinate = {
  lat: number;
  lng: number;
};

type AutoRouteStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  chargerDetails?: PlaceItemEvChargerDetails;
  chargerId?: string;
};

type ChargerCandidate = {
  charger: EvCharger;
  distanceFromCurrentKm: number;
  distanceToDestinationKm: number;
  detourKm: number;
  score: number;
};

export type AutoEvChargerInsertion = {
  charger: EvCharger;
  beforeItemId: string;
  fromItemId: string;
  toItemId: string;
  sequence: number;
  estimatedChargeMinutes: number;
  projectedArrivalBatteryPct: number;
  projectedDepartureBatteryPct: number;
  detourKm: number;
  reason: string;
};

export type AutoEvChargerPlan = {
  insertions: AutoEvChargerInsertion[];
  finalBatteryPct: number;
  message: string;
  warnings: string[];
};

type AutoEvChargerPlanInput = {
  block: TripBlockData;
  car: EvCar;
  startingBatteryPct: number;
  chargeTargetPct?: number;
  chargers: EvCharger[];
};

type RouteProjection = {
  ratio: number;
  deviationKm: number;
};

export function planAutoEvChargers({
  block,
  car,
  startingBatteryPct,
  chargeTargetPct,
  chargers,
}: AutoEvChargerPlanInput): AutoEvChargerPlan {
  const stops = block.items.filter(isPlaceItem).map(placeItemToRouteStop);
  const insertions: AutoEvChargerInsertion[] = [];
  const warnings: string[] = [];
  const stopChargeTargetPct = normalizeChargeTargetPct(chargeTargetPct);

  if (stops.length < 2) {
    return {
      insertions,
      finalBatteryPct: clampPct(startingBatteryPct),
      message: "Add at least a starting point and one destination to your itinerary before auto-planning chargers.",
      warnings,
    };
  }

  const existingChargerIds = new Set(
    stops
      .map((stop) => stop.chargerId)
      .filter((id): id is string => Boolean(id)),
  );
  const compatibleChargers = chargers.filter(
    (charger) =>
      charger.status === "active" &&
      isCompatible(car.connectorTypes, charger.connectorTypes),
  );
  const plannedChargerIds = new Set<string>();
  let batteryPct = clampPct(startingBatteryPct);
  const startBatteryIsLow = batteryPct < AUTO_COMFORT_ARRIVAL_PCT;
  let routeWarningCount = 0;

  if (batteryPct < AUTO_MIN_ARRIVAL_PCT) {
    const preDepartureCharger = findNearbyCharger(
      compatibleChargers,
      stops[0]!,
      existingChargerIds,
      plannedChargerIds,
    );

    if (preDepartureCharger) {
      const isChargerDc = isDcCharger(preDepartureCharger.connectorTypes);
      const targetPct = Math.max(stopChargeTargetPct, batteryPct);
      const chargeEnergyKwh = ((targetPct - batteryPct) / 100) * car.batteryKwh;
      const estimatedChargeMinutes = calcChargeMinutesForEnergyKwh(
        chargeEnergyKwh,
        preDepartureCharger.maxKw,
        car,
        preDepartureCharger.connectorTypes,
      );
      const detourKm = getDistanceKm(stops[0]!, preDepartureCharger.location);
      const effectiveKw = effectiveChargeKw(preDepartureCharger.maxKw, car, isChargerDc);

      plannedChargerIds.add(preDepartureCharger.id);
      insertions.push({
        charger: preDepartureCharger,
        beforeItemId: stops[0]!.id,
        fromItemId: stops[0]!.id,
        toItemId: stops[0]!.id,
        sequence: 0,
        estimatedChargeMinutes,
        projectedArrivalBatteryPct: Math.round(batteryPct),
        projectedDepartureBatteryPct: Math.round(targetPct),
        detourKm,
        reason: `Starting battery is critically low (${Math.round(batteryPct)}%). Charge here before departure — ${Math.round(effectiveKw)} kW ${isChargerDc ? "DC" : "AC"}.`,
      });

      batteryPct = targetPct;
    } else {
      warnings.push(
        `Starting battery is critically low (${Math.round(batteryPct)}%). No nearby compatible charger found — charge before departure.`,
      );
    }
  }

  let currentStop = stops[0]!;

  for (let stopIndex = 1; stopIndex < stops.length; stopIndex += 1) {
    const destination = stops[stopIndex]!;
    let legInsertionCount = 0;

    if (currentStop.chargerDetails) {
      batteryPct = chargeAtExistingStop(batteryPct, currentStop.chargerDetails, car);
    }

    while (legInsertionCount < MAX_AUTO_INSERTIONS_PER_LEG) {
      const legKm = getDistanceKm(currentStop, destination);
      const legUsePct = calcBatteryUsedPct(legKm, car);
      const projectedArrivalPct = batteryPct - legUsePct;
      const requiredStop = projectedArrivalPct < AUTO_MIN_ARRIVAL_PCT;
      const strategicStop =
        !requiredStop &&
        (
          (legUsePct >= AUTO_HEAVY_LEG_PCT && projectedArrivalPct < AUTO_COMFORT_ARRIVAL_PCT + 20) ||
          (legUsePct >= 10 && projectedArrivalPct < stopChargeTargetPct)
        );

      if (!requiredStop && !strategicStop) {
        break;
      }

      const candidate = findBestAutoCharger({
        car,
        chargers: compatibleChargers,
        currentStop,
        destination,
        batteryPct,
        existingChargerIds,
        plannedChargerIds,
        requiredStop,
        chargeTargetPct: stopChargeTargetPct,
      });

      if (!candidate) {
        if (requiredStop) {
          warnings.push(
            `No compatible reachable charger found between ${currentStop.name} and ${destination.name}.`,
          );
          routeWarningCount += 1;
        }
        break;
      }

      const arrivalBatteryPct = clampPct(
        batteryPct -
          calcBatteryUsedPct(candidate.distanceFromCurrentKm, car),
      );
      const nextLegUsePct = calcBatteryUsedPct(
        candidate.distanceToDestinationKm,
        car,
      );
      const departureBatteryPct = getDepartureTargetPct(
        arrivalBatteryPct,
        nextLegUsePct,
        stopChargeTargetPct,
      );
      const chargeEnergyKwh =
        ((departureBatteryPct - arrivalBatteryPct) / 100) * car.batteryKwh;
      const estimatedChargeMinutes = calcChargeMinutesForEnergyKwh(
        chargeEnergyKwh,
        candidate.charger.maxKw,
        car,
        candidate.charger.connectorTypes,
      );

      legInsertionCount += 1;
      plannedChargerIds.add(candidate.charger.id);
      insertions.push({
        charger: candidate.charger,
        beforeItemId: destination.id,
        fromItemId: currentStop.id,
        toItemId: destination.id,
        sequence: legInsertionCount,
        estimatedChargeMinutes,
        projectedArrivalBatteryPct: Math.round(arrivalBatteryPct),
        projectedDepartureBatteryPct: Math.round(departureBatteryPct),
        detourKm: candidate.detourKm,
        reason: requiredStop
          ? `Keeps reserve before ${destination.name}`
          : `Adds a faster top-up on a high-use leg to ${destination.name}`,
      });

      batteryPct = departureBatteryPct;
      currentStop = chargerToRouteStop(candidate.charger);
    }

    const finalLegKm = getDistanceKm(currentStop, destination);
    batteryPct = clampPct(batteryPct - calcBatteryUsedPct(finalLegKm, car));
    currentStop = destination;
  }

  return {
    insertions,
    finalBatteryPct: Math.round(batteryPct),
    message:
      insertions.length > 0
        ? `Planned ${insertions.length} charger${insertions.length === 1 ? "" : "s"} in route order.`
        : routeWarningCount > 0
          ? "No safe compatible charger plan could be found."
          : startBatteryIsLow
            ? `Route is manageable but starting battery is low (${Math.round(startingBatteryPct)}%). Consider charging before departure.`
            : "Route already looks efficient for the selected EV.",
    warnings,
  };
}

function placeItemToRouteStop(item: PlaceItem): AutoRouteStop {
  const chargerId = isEvChargerPlaceItem(item)
    ? item.placeId.replace("ev-charger:", "")
    : undefined;

  return {
    id: item.id,
    name: item.name,
    lat: item.lat,
    lng: item.lng,
    chargerDetails: item.evCharger,
    chargerId,
  };
}

function chargerToRouteStop(charger: EvCharger): AutoRouteStop {
  return {
    id: `auto:${charger.id}`,
    name: charger.name,
    lat: charger.location.lat,
    lng: charger.location.lng,
    chargerId: charger.id,
  };
}

function chargeAtExistingStop(
  currentBatteryPct: number,
  charger: PlaceItemEvChargerDetails,
  car: EvCar,
): number {
  if (!isCompatible(car.connectorTypes, charger.connectorTypes)) {
    return currentBatteryPct;
  }

  const effectiveKw = effectiveChargeKw(
    charger.maxKw,
    car,
    isDcCharger(charger.connectorTypes),
  );
  const energyKwh = (charger.estimatedChargeMinutes / 60) * effectiveKw;
  const addedPct = (energyKwh / car.batteryKwh) * 100;

  return Math.min(AUTO_MAX_CHARGE_TARGET_PCT, currentBatteryPct + addedPct);
}

function findBestAutoCharger({
  car,
  chargers,
  currentStop,
  destination,
  batteryPct,
  existingChargerIds,
  plannedChargerIds,
  requiredStop,
  chargeTargetPct,
}: {
  car: EvCar;
  chargers: EvCharger[];
  currentStop: AutoRouteStop;
  destination: AutoRouteStop;
  batteryPct: number;
  existingChargerIds: Set<string>;
  plannedChargerIds: Set<string>;
  requiredStop: boolean;
  chargeTargetPct: number;
}): ChargerCandidate | null {
  const strictCandidate = scoreAutoChargers({
    car,
    chargers,
    currentStop,
    destination,
    batteryPct,
    existingChargerIds,
    plannedChargerIds,
    requiredStop,
    chargeTargetPct,
    relaxed: false,
  });

  if (strictCandidate || !requiredStop) {
    return strictCandidate;
  }

  return scoreAutoChargers({
    car,
    chargers,
    currentStop,
    destination,
    batteryPct,
    existingChargerIds,
    plannedChargerIds,
    requiredStop,
    chargeTargetPct,
    relaxed: true,
  });
}

function scoreAutoChargers({
  car,
  chargers,
  currentStop,
  destination,
  batteryPct,
  existingChargerIds,
  plannedChargerIds,
  requiredStop,
  chargeTargetPct,
  relaxed,
}: {
  car: EvCar;
  chargers: EvCharger[];
  currentStop: AutoRouteStop;
  destination: AutoRouteStop;
  batteryPct: number;
  existingChargerIds: Set<string>;
  plannedChargerIds: Set<string>;
  requiredStop: boolean;
  chargeTargetPct: number;
  relaxed: boolean;
}): ChargerCandidate | null {
  const directKm = getDistanceKm(currentStop, destination);
  const desiredProgress = requiredStop
    ? getSafeReachProgressRatio(directKm, batteryPct, car)
    : 0.58;
  const maxDetourKm = relaxed
    ? Math.max(70, directKm * 0.7)
    : requiredStop
      ? Math.max(35, directKm * 0.42)
      : Math.max(18, directKm * 0.18);
  const maxDeviationKm = relaxed
    ? Math.max(55, directKm * 0.5)
    : Math.max(14, directKm * 0.22);
  let bestCandidate: ChargerCandidate | null = null;

  for (const charger of chargers) {
    if (
      existingChargerIds.has(charger.id) ||
      plannedChargerIds.has(charger.id)
    ) {
      continue;
    }

    const chargerLocation = charger.location;
    const projection = getRouteProjection(currentStop, destination, chargerLocation);
    const minProgress = relaxed ? 0.02 : 0.06;
    const maxProgress = relaxed ? 0.98 : 0.94;

    if (projection.ratio < minProgress || projection.ratio > maxProgress) {
      continue;
    }

    if (projection.deviationKm > maxDeviationKm) {
      continue;
    }

    const distanceFromCurrentKm = getDistanceKm(currentStop, chargerLocation);
    const distanceToDestinationKm = getDistanceKm(chargerLocation, destination);
    const detourKm = Math.max(
      0,
      distanceFromCurrentKm + distanceToDestinationKm - directKm,
    );

    if (detourKm > maxDetourKm) {
      continue;
    }

    const arrivalPct =
      batteryPct - calcBatteryUsedPct(distanceFromCurrentKm, car);

    if (arrivalPct < AUTO_ABSOLUTE_MIN_ARRIVAL_PCT) {
      continue;
    }

    const effectiveKw = effectiveChargeKw(
      charger.maxKw,
      car,
      isDcCharger(charger.connectorTypes),
    );
    const nextLegUsePct = calcBatteryUsedPct(distanceToDestinationKm, car);
    const targetPct = getDepartureTargetPct(
      arrivalPct,
      nextLegUsePct,
      chargeTargetPct,
    );
    const chargeEnergyKwh = ((targetPct - arrivalPct) / 100) * car.batteryKwh;
    const chargeMinutes = calcChargeMinutesForEnergyKwh(
      chargeEnergyKwh,
      charger.maxKw,
      car,
      charger.connectorTypes,
    );
    const availabilityRatio =
      charger.availableConnectors == null
        ? 0.5
        : charger.availableConnectors / Math.max(1, charger.totalConnectors);
    const progressPenalty =
      Math.abs(projection.ratio - desiredProgress) * directKm * 0.7;
    const detourPenalty = detourKm * 2.6;
    const deviationPenalty = projection.deviationKm * 3.2;
    const speedBonus = Math.min(effectiveKw, 250) * 0.11;
    const availabilityBonus = availabilityRatio * 8;
    const trustBonus = charger.confidenceScore * 5 + charger.ratingAvg * 0.8;
    const score =
      chargeMinutes +
      progressPenalty +
      detourPenalty +
      deviationPenalty -
      speedBonus -
      availabilityBonus -
      trustBonus;

    if (!bestCandidate || score < bestCandidate.score) {
      bestCandidate = {
        charger,
        distanceFromCurrentKm,
        distanceToDestinationKm,
        detourKm,
        score,
      };
    }
  }

  return bestCandidate;
}

function getSafeReachProgressRatio(
  directKm: number,
  batteryPct: number,
  car: EvCar,
): number {
  const usablePct = Math.max(0, batteryPct - AUTO_MIN_ARRIVAL_PCT);
  const reachableKm = calcRangeKmForBatteryPct(usablePct, car);

  if (directKm <= 0) {
    return 0.5;
  }

  return clampNumber((reachableKm / directKm) * 0.82, 0.22, 0.82);
}

function getDepartureTargetPct(
  arrivalPct: number,
  nextLegUsePct: number,
  chargeTargetPct: number,
): number {
  return Math.min(
    AUTO_MAX_CHARGE_TARGET_PCT,
    Math.max(
      arrivalPct,
      chargeTargetPct,
      nextLegUsePct + AUTO_COMFORT_ARRIVAL_PCT,
    ),
  );
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

function calcRangeKmForBatteryPct(batteryPct: number, car: EvCar): number {
  const energyKwh = (clampPct(batteryPct) / 100) * car.batteryKwh;
  return (energyKwh / car.consumptionKwhPer100km) * 100;
}

function getRouteProjection(
  from: Coordinate,
  to: Coordinate,
  point: Coordinate,
): RouteProjection {
  const avgLatRad = (((from.lat + to.lat) / 2) * Math.PI) / 180;
  const kmPerLat = 110.574;
  const kmPerLng = 111.32 * Math.cos(avgLatRad);
  const toX = (to.lng - from.lng) * kmPerLng;
  const toY = (to.lat - from.lat) * kmPerLat;
  const pointX = (point.lng - from.lng) * kmPerLng;
  const pointY = (point.lat - from.lat) * kmPerLat;
  const lengthSq = toX * toX + toY * toY;

  if (lengthSq <= 0) {
    return { ratio: 0, deviationKm: getDistanceKm(from, point) };
  }

  const ratio = clampNumber((pointX * toX + pointY * toY) / lengthSq, 0, 1);
  const projectedX = toX * ratio;
  const projectedY = toY * ratio;
  const deviationKm = Math.sqrt(
    (pointX - projectedX) ** 2 + (pointY - projectedY) ** 2,
  );

  return { ratio, deviationKm };
}

function findNearbyCharger(
  chargers: EvCharger[],
  stop: AutoRouteStop,
  existingChargerIds: Set<string>,
  plannedChargerIds: Set<string>,
  radiusKm = 15,
): EvCharger | null {
  let best: EvCharger | null = null;
  let bestScore = Infinity;

  for (const charger of chargers) {
    if (existingChargerIds.has(charger.id) || plannedChargerIds.has(charger.id)) {
      continue;
    }

    const distKm = getDistanceKm(stop, charger.location);
    if (distKm > radiusKm) continue;

    const speedScore = -Math.min(charger.maxKw, 250) * 0.15;
    const availabilityScore =
      charger.availableConnectors == null
        ? 0
        : -((charger.availableConnectors / Math.max(1, charger.totalConnectors)) * 5);
    const score = distKm * 2 + speedScore + availabilityScore;

    if (score < bestScore) {
      bestScore = score;
      best = charger;
    }
  }

  return best;
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
