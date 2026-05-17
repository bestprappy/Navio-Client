import type { EvCharger, EvConnectorType } from "../constants/types";

const connectorLabels: Record<EvConnectorType, string> = {
  CCS1: "CCS1",
  CCS2: "CCS2",
  CHADEMO: "CHAdeMO",
  TYPE2: "Type 2",
  J1772: "J1772",
  NACS: "NACS",
  GB_T: "GB/T",
  OTHER: "Other",
};

export function formatConnectorLabel(connector: EvConnectorType): string {
  return connectorLabels[connector];
}

export function getAvailabilityLabel(charger: EvCharger): string {
  if (charger.availableConnectors === null) {
    return `${charger.totalConnectors} ports`;
  }

  return `${charger.availableConnectors} ports available`;
}

export function getAvailabilitySummary(charger: EvCharger): string {
  if (charger.availableConnectors === null) {
    return `${charger.totalConnectors} total ports`;
  }

  return `${charger.availableConnectors}/${charger.totalConnectors} available`;
}

export function getOpeningHoursSummary(
  openingHours: Record<string, unknown>,
): string | null {
  const summary = openingHours.summary;
  return typeof summary === "string" ? summary : null;
}

export function getPricePerKwh(priceText: string | null): string {
  if (!priceText) {
    return "Varies";
  }

  if (/free/i.test(priceText)) {
    return "$0";
  }

  const priceMatch = priceText.match(/\$?\d+(?:\.\d+)?/);
  if (!priceMatch) {
    return priceText;
  }

  return priceMatch[0].startsWith("$")
    ? priceMatch[0]
    : `$${priceMatch[0]}`;
}
