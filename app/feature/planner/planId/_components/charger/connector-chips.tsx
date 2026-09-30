import { cn } from "@/lib/utils";

import type { EvConnectorType } from "../constants/types";
import { formatConnectorLabel } from "./ev-station-formatters";

/** One hue per plug family (see --connector-* in globals.css); CCS1 and CCS2 share a family. */
const connectorChipTone: Record<EvConnectorType, string> = {
  CCS1: "border-connector-ccs/35 bg-connector-ccs/12 text-connector-ccs",
  CCS2: "border-connector-ccs/35 bg-connector-ccs/12 text-connector-ccs",
  CHADEMO: "border-connector-chademo/35 bg-connector-chademo/12 text-connector-chademo",
  TYPE2: "border-connector-type2/35 bg-connector-type2/12 text-connector-type2",
  J1772: "border-connector-j1772/35 bg-connector-j1772/12 text-connector-j1772",
  NACS: "border-connector-nacs/35 bg-connector-nacs/12 text-connector-nacs",
  GB_T: "border-connector-gbt/35 bg-connector-gbt/12 text-connector-gbt",
  OTHER: "border-border bg-muted text-muted-foreground",
};

const connectorCurrentLabel: Record<EvConnectorType, string> = {
  CCS1: "DC fast charging",
  CCS2: "DC fast charging",
  CHADEMO: "DC fast charging",
  GB_T: "DC fast charging",
  NACS: "DC fast charging",
  TYPE2: "AC charging",
  J1772: "AC charging",
  OTHER: "Other connector",
};

type ConnectorChipsProps = {
  connectors: EvConnectorType[];
  /** Show at most this many chips, then "+n". */
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

/** Plug types as color-coded chips; the hover title and screen-reader text say DC or AC. */
export function ConnectorChips({ connectors, max = connectors.length, size = "sm", className }: ConnectorChipsProps) {
  if (connectors.length === 0) return null;
  const shown = connectors.slice(0, max);
  const hidden = connectors.length - shown.length;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {shown.map((connector) => (
        <span
          key={connector}
          title={connectorCurrentLabel[connector]}
          className={cn(
            "rounded-sm border font-semibold leading-none",
            size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
            connectorChipTone[connector],
          )}
        >
          {formatConnectorLabel(connector)}
          <span className="sr-only">, {connectorCurrentLabel[connector]}</span>
        </span>
      ))}
      {hidden > 0 ? <span className="px-1 py-0.5 text-xs leading-none text-muted-foreground">+{hidden}</span> : null}
    </span>
  );
}
