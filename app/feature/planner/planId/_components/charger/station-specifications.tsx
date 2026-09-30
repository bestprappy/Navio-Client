"use client";

import { Banknote, PlugZap, Zap } from "lucide-react";

import type { PlaceItem } from "../constants/types";
import { SpecTile } from "../garage/spec-tile";
import { ConnectorChips } from "./connector-chips";
import { StationOpeningHours } from "./station-opening-hours";

export function StationSpecifications({ item }: { item: PlaceItem }) {
  const details = item.evCharger;
  const ports = !details
    ? "Not listed"
    : details.availableConnectors == null
      ? `${details.totalConnectors}`
      : `${details.availableConnectors} of ${details.totalConnectors}`;

  return (
    <div className="min-w-0 space-y-3 text-sm">
      <dl className="grid grid-cols-2 gap-2">
        <SpecTile
          icon={Zap}
          tone="primary"
          label="Max power"
          value={details?.maxKw ? String(details.maxKw) : "Not listed"}
          unit={details?.maxKw ? "kW" : undefined}
        />
        <SpecTile icon={PlugZap} tone="rating" label={details?.availableConnectors == null ? "Ports" : "Free ports"} value={ports} />
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">Plugs</span>
        {details?.connectorTypes.length ? (
          <ConnectorChips connectors={details.connectorTypes} />
        ) : (
          <span className="text-foreground">Not listed</span>
        )}
      </div>

      <p className="flex items-start gap-2">
        <Banknote className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">Price</span>
        <span className="ml-auto min-w-0 text-right wrap-break-word font-medium text-foreground">
          {details?.priceText || "Not listed"}
        </span>
      </p>
      <StationOpeningHours value={details?.openingHoursSummary} />
    </div>
  );
}
