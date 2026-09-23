import type { EvCar } from "../constants/vehicle.types";
import { isPlaceItem, type PlaceItemEvChargerDetails, type TripBlockData } from "../constants/types";
import { getTripRouteGroups } from "../routes/trip-route.helpers";
import { resolveDayAnchors } from "../itinerary/day-anchors";
import type { RouteSegment } from "../routes/trip-route.types";
import { calculateEnergy, positive, projectEnergyTrip, type ChargingEvent, type EnergyModel, type EnergyResult, type EnergyStop } from "./energy-model";

export function energyModelForCar(car: EvCar): EnergyModel {
  return car.energyProfile ?? {
    modelKind: positive(car.consumptionKwhPer100km) ? "CONSUMPTION" : "UNAVAILABLE",
    consumptionKwhPer100km: positive(car.consumptionKwhPer100km) ? car.consumptionKwhPer100km : null,
    usableBatteryCapacityKwh: null, ratedRangeKm: null,
  };
}
const DC = new Set(["CCS1", "CCS2", "CHADEMO", "NACS", "GB_T"]);
export function chargingEventForCar(details: PlaceItemEvChargerDetails, car: EvCar): ChargingEvent {
  const matching = details.connectorTypes.filter(c => c !== "OTHER" && car.connectorTypes.includes(c));
  const limits = car.chargingCapabilities ?? { acKw: car.chargingLimitsKnown === true ? car.maxAcKw : null, dcKw: car.chargingLimitsKnown === true ? car.maxDcKw : null };
  const powers = matching.map(c => DC.has(c) ? limits.dcKw : limits.acKw).filter(positive);
  return {
    targetSocPct: details.targetBatteryPct ?? null,
    durationMinutes: details.estimatedChargeMinutes !== null && details.estimatedChargeMinutes >= 0 ? details.estimatedChargeMinutes : null,
    compatible: matching.length > 0 ? true : details.connectorTypes.includes("OTHER") || car.connectorTypes.includes("OTHER") ? null : false,
    effectivePowerKw: positive(details.maxKw) && powers.length ? Math.min(details.maxKw, Math.max(...powers)) : null,
  };
}
export type StopBatteryProjection = EnergyResult & {
  arrivalPct: number | null; departurePct: number | null;
  chargeMinutes: number | null; compatible: boolean;
};
export function projectCanonicalCharging(arrival: number | null, details: PlaceItemEvChargerDetails, car: EvCar): StopBatteryProjection {
  const charging = chargingEventForCar(details, car);
  // Charging preview starts from a known stop state, independent of driving availability.
  const result = calculateEnergy({ model: energyModelForCar(car), distanceKm: 0, distanceQuality: "ROUTED", departureSocPct: arrival, charging });
  return { ...result, modelKind: energyModelForCar(car).modelKind, provisional: car.energyProfile?.modelKind === "RATED_RANGE", arrivalPct: arrival, departurePct: result.departureSocPct, chargeMinutes: result.nominalChargeMinutes, compatible: charging.compatible === true };
}
export type CanonicalTripSummary = {
  totalDistanceKm: number | null; totalEnergyKwh: number | null; totalChargeMinutes: number | null;
  finalBatteryPct: number | null; batteryByDay: (number | null)[];
  infeasible: boolean; provisional: boolean; reasons: string[];
};
export type CanonicalDayProjection = {
  startBatteryPct: number | null; finalBatteryPct: number | null;
  predictedBelowReserve: boolean; infeasible: boolean;
  distanceKm: number | null; energyKwh: number | null; chargeMinutes: number | null;
  chargeEnergyKwh: number | null; compatibleStops: number; incompatibleStops: number;
  batteryByItemId: Map<string, StopBatteryProjection>;
};
const sum = (values: (number | null)[]) => values.some(v => v === null) ? null : values.reduce<number>((a, b) => a + (b ?? 0), 0);

/** Planner and Explore feed the same ordered itinerary/route adapter. */
export function projectCanonicalTrip(blocks: TripBlockData[], segments: RouteSegment[], car: EvCar, initialSoc: number | null) {
  const days = blocks.filter(b => b.kind === "itinerary").toSorted((a,b) => a.date.localeCompare(b.date));
  const groups = new Map(getTripRouteGroups(blocks).map(g => [g.blockId, g.points]));
  const anchors = resolveDayAnchors(blocks);
  const byEndpoints = new Map(segments.map(s => [`${s.blockId}:${s.fromItemId}:${s.toItemId}`, s]));
  const events: EnergyStop[] = [];
  let previousPosition: {lat:number;lng:number} | undefined;
  for (const day of days) {
    const items = new Map(day.items.filter(isPlaceItem).map(i => [i.id, i]));
    const dayAnchors = anchors.get(day.id);
    const points = groups.get(day.id) ?? [
      ...(dayAnchors?.start ? [{...dayAnchors.start,id:`${day.id}:start`}] : []),
      ...day.items.filter(isPlaceItem),
      ...(dayAnchors?.end ? [{...dayAnchors.end,id:`${day.id}:end`}] : []),
    ];
    if (!points.length) continue;
    for (let index=0;index<points.length;index++) {
      const point=points[index], item=items.get(point.id);
      const segment=index ? byEndpoints.get(`${day.id}:${points[index-1].id}:${point.id}`) : undefined;
      const discontinuity=index===0 && previousPosition && (Math.abs(previousPosition.lat-point.lat)>1e-6 || Math.abs(previousPosition.lng-point.lng)>1e-6);
      const distanceKm=index===0 && !discontinuity ? 0 : segment?.distanceMeters == null ? null : segment.distanceMeters/1000;
      events.push({ id:point.id,dayId:day.id,distanceKm,distanceQuality:distanceKm===null ? "UNAVAILABLE" : segment?.status==="fallback" ? "FALLBACK" : "ROUTED",
        observedSocPct:item?.observedSocCheckpoint?.socPct,charging:item?.evCharger ? chargingEventForCar(item.evCharger,car) : null });
      previousPosition=point;
    }
  }
  const results=projectEnergyTrip(energyModelForCar(car),initialSoc,events);
  const projections=new Map<string,CanonicalDayProjection>();
  let forward=initialSoc;
  for(const day of days) {
    const states=results.filter(r=>r.dayId===day.id);
    const start=forward; forward=states.length ? states[states.length-1].departureSocPct : forward;
    const dayEvents=events.filter(e=>e.dayId===day.id);
    projections.set(day.id,{startBatteryPct:start,finalBatteryPct:forward,
      predictedBelowReserve:states.some(r=>r.predictedArrivalReserveStatus==="BELOW_RESERVE"),infeasible:states.some(r=>r.predictedLegFeasibility==="INFEASIBLE"),
      distanceKm:sum(dayEvents.map(e=>e.distanceKm)),energyKwh:sum(states.map(r=>r.nominalEnergyKwh)),
      chargeEnergyKwh:sum(states.map(r=>r.chargeEnergyKwh)),chargeMinutes:sum(states.map(r=>r.nominalChargeMinutes)),
      compatibleStops:dayEvents.filter(e=>e.charging?.compatible===true).length,incompatibleStops:dayEvents.filter(e=>e.charging?.compatible===false).length,
      batteryByItemId:new Map(states.map(r=>[r.id,{...r,arrivalPct:r.rawPredictedArrivalSocPct,departurePct:r.departureSocPct,chargeMinutes:r.nominalChargeMinutes,compatible:dayEvents.find(e=>e.id===r.id)?.charging?.compatible===true}])),
    });
  }
  const summary:CanonicalTripSummary={totalDistanceKm:sum(events.map(e=>e.distanceKm)),totalEnergyKwh:sum(results.map(r=>r.nominalEnergyKwh)),totalChargeMinutes:sum(results.map(r=>r.nominalChargeMinutes)),finalBatteryPct:forward,batteryByDay:[...projections.values()].map(d=>d.finalBatteryPct),infeasible:results.some(r=>r.predictedLegFeasibility==="INFEASIBLE"),provisional:car.energyProfile?.modelKind==="RATED_RANGE",reasons:[...new Set(results.flatMap(r=>r.reasons))]};
  return {days:projections,summary,results};
}
