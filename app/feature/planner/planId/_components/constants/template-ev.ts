import type {
  PlanGarage,
  PlanTemplatePlace,
} from "@/app/feature/explore/_components/data";

import type { EvConnectorType, PlaceItemEvChargerDetails } from "./types";
import type { EvCar, UserVehicle } from "./vehicle.types";

const CONNECTOR_ALIASES: Array<[RegExp, EvConnectorType]> = [
  [/CCS\s*1/i, "CCS1"],
  [/CCS\s*2/i, "CCS2"],
  [/CHA\s*DE\s*MO/i, "CHADEMO"],
  [/TYPE\s*2/i, "TYPE2"],
  [/J1772/i, "J1772"],
  [/NACS|TESLA/i, "NACS"],
  [/GB\s*\/?\s*T/i, "GB_T"],
];

export function parseEvConnectorTypes(value?: string): EvConnectorType[] {
  const text = value?.trim();
  if (!text) return ["OTHER"];

  const connectorTypes = new Set<EvConnectorType>();

  text.split(",").forEach((part) => {
    const match = CONNECTOR_ALIASES.find(([pattern]) => pattern.test(part));
    connectorTypes.add(match?.[1] ?? "OTHER");
  });

  return connectorTypes.size > 0 ? [...connectorTypes] : ["OTHER"];
}

export function getPlanTemplatePlaceEvChargerDetails(
  place: PlanTemplatePlace,
): PlaceItemEvChargerDetails | undefined {
  if (!place.isEvCharger) return undefined;

  const maxKw = place.evPowerKw ?? 0;

  return {
    connectorTypes: parseEvConnectorTypes(place.evConnectors),
    maxKw,
    totalConnectors: 1,
    availableConnectors: null,
    priceText: null,
    openingHoursSummary: null,
    estimatedChargeMinutes: null,
    operatorName: null,
  };
}

export function getPlanGarageEvCar(
  id: string,
  garage: PlanGarage,
): EvCar {
  return {
    id,
    make: garage.make,
    model: garage.model,
    year: garage.year,
    batteryKwh: garage.batteryCapacityKwh,
    rangeKm: garage.rangeKm,
    consumptionKwhPer100km: 0, // Legacy display adapter only; canonical profile carries null.
    maxAcKw: 0, maxDcKw: 0,
    chargingCapabilities: { acKw: null, dcKw: null },
    chargingLimitsKnown: false,
    energyProfile: { version: 1, modelKind: garage.rangeKm > 0 ? "RATED_RANGE" : "UNAVAILABLE", selectionMode: "LEGACY_UNCONFIRMED", consumptionKwhPer100km: null, consumptionSource: "UNKNOWN", consumptionMeasurementBasis: "UNKNOWN", consumptionStandard: "NONE", sourceUrl: null, usableBatteryCapacityKwh: null, capacityBasis: "MANUFACTURER_DECLARED_UNSPECIFIED", ratedRangeKm: garage.rangeKm > 0 ? garage.rangeKm : null, ratedRangeStandard: "NONE" },
    connectorTypes: parseEvConnectorTypes(garage.connectorType),
    imageUrl: garage.imageUrl,
  };
}

export function getPlanGarageUserVehicle(
  id: string,
  garage: PlanGarage,
  startingBatteryPct: number,
): UserVehicle {
  return {
    id,
    source: "custom",
    nickname: garage.trim
      ? `${garage.year} ${garage.make} ${garage.model} ${garage.trim}`
      : `${garage.year} ${garage.make} ${garage.model}`,
    customCar: getPlanGarageEvCar(`car-${id}`, garage),
    startingBatteryPct,
  };
}
