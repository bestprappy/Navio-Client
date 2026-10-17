import type { ReactNode } from "react";

import { readableForeground } from "@/lib/palette/palette-colors";
import { cn } from "@/lib/utils";

type PaletteColorTileProps = {
  name: string;
  hex: string;
  /** Retired colors are shown muted so the active palette stands out. */
  muted?: boolean;
  action?: ReactNode;
};

/** One palette color: swatch, name and hex, with an optional action on the right. */
export function PaletteColorTile({ name, hex, muted = false, action }: PaletteColorTileProps) {
  return (
    <li className={cn("flex items-center gap-3 rounded-lg border bg-card p-3 shadow-xs", muted && "bg-muted/40")}>
      <span
        aria-hidden="true"
        className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-xs", muted && "opacity-60")}
        style={{ backgroundColor: hex, color: readableForeground(hex) }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm font-medium", muted && "text-muted-foreground")}>{name}</span>
        <span className="font-mono text-xs text-muted-foreground uppercase">{hex}</span>
      </span>
      {action}
    </li>
  );
}
