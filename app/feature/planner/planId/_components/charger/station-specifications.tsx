"use client";

import { BatteryCharging, Plug, Zap } from "lucide-react";
import type { PlaceItem } from "../constants/types";
import { formatConnectorLabel } from "./ev-station-formatters";
import { StationOpeningHours } from "./station-opening-hours";

export function StationSpecifications({ item }: { item: PlaceItem }) {
  const details = item.evCharger;
  const specifications = [
    { label: "Connectors", value: details?.connectorTypes.length ? details.connectorTypes.map(formatConnectorLabel).join(", ") : "Not listed", icon: Plug },
    { label: "Charging power", value: details?.maxKw ? `${details.maxKw} kW` : "Not listed", icon: BatteryCharging },
    { label: details?.availableConnectors == null ? "Total ports" : "Available ports", value: details ? details.availableConnectors == null ? `${details.totalConnectors}` : `${details.availableConnectors} of ${details.totalConnectors}` : "Not listed", icon: Zap },
  ];
  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
      <dl className="grid gap-3">
        {specifications.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <dt className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />{label}</dt>
            <dd className="min-w-0 break-words font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-3 border-t border-border/70 pt-3">
        <p className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span className="text-muted-foreground">Price</span><span className="min-w-0 break-words text-foreground">{details?.priceText || "Not listed"}</span></p>
        <StationOpeningHours value={details?.openingHoursSummary} />
      </div>
    </div>
  );
}
