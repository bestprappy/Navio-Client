"use client";

import type { PlaceItem } from "../constants/types";
import { formatConnectorLabel } from "./ev-station-formatters";
import { SpecCell } from "./spec-cell";
import { StationOpeningHours } from "./station-opening-hours";

export function StationSpecifications({ item }: { item: PlaceItem }) {
  const details = item.evCharger;
  const plugs = details?.connectorTypes.length
    ? details.connectorTypes.map(formatConnectorLabel).join(" · ")
    : "Not listed";
  const ports = !details
    ? "Not listed"
    : details.availableConnectors == null
      ? `${details.totalConnectors}`
      : `${details.availableConnectors} of ${details.totalConnectors}`;

  return (
    <div className="min-w-0 space-y-3 text-sm">
      <dl className="surface-well grid grid-cols-2 gap-px overflow-hidden rounded-md bg-border/60">
        <SpecCell
          label="Max power"
          value={details?.maxKw ? String(details.maxKw) : "Not listed"}
          unit={details?.maxKw ? "kW" : undefined}
        />
        <SpecCell label={details?.availableConnectors == null ? "Ports" : "Free ports"} value={ports} />
        <SpecCell label="Plugs" value={plugs} mono={false} className="col-span-2" />
      </dl>
      <dl>
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Price</dt>
          <dd className="min-w-0 wrap-break-word text-foreground">{details?.priceText || "Not listed"}</dd>
        </div>
      </dl>
      <StationOpeningHours value={details?.openingHoursSummary} />
    </div>
  );
}
