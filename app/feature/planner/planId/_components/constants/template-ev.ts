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

export function getEstimatedChargeMinutes(maxKw: number): number {
  if (maxKw >= 100) return 35;
  if (maxKw >= 50) return 50;
  if (maxKw >= 22) return 90;
  return 150;
}

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
    estimatedChargeMinutes: getEstimatedChargeMinutes(maxKw),
    operatorName: null,
  };
}

export function getPlanGarageEvCar(
  id: string,
  garage: PlanGarage,
): EvCar {
  const consumptionKwhPer100km =
    Math.round((garage.batteryCapacityKwh / garage.rangeKm) * 100 * 10) / 10;

  return {
    id,
    make: garage.make,
    model: garage.model,
    year: garage.year,
    batteryKwh: garage.batteryCapacityKwh,
    rangeKm: garage.rangeKm,
    consumptionKwhPer100km,
    maxAcKw: 11,
    maxDcKw: 250,
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
