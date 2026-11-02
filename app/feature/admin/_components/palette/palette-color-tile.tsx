import type { CSSProperties, ReactNode } from "react";

import { labelColor } from "@/lib/palette/palette-colors";
import { cn } from "@/lib/utils";

import type { TextColors } from "./palette-api";

type PaletteColorTileProps = TextColors & {
  name: string;
  hex: string;
  /** Retired colors are shown muted so the active palette stands out. */
  muted?: boolean;
  actions?: ReactNode;
};

type SwatchStyle = CSSProperties & { "--label-light": string; "--label-dark": string };

/** One palette color: swatch drawn with its label text for the current theme, name, hex and actions. */
export function PaletteColorTile({ name, hex, textOnLight, textOnDark, muted = false, actions }: PaletteColorTileProps) {
  const swatch: SwatchStyle = {
    backgroundColor: hex,
    "--label-light": labelColor(hex, textOnLight),
    "--label-dark": labelColor(hex, textOnDark),
  };

  return (
    <li className={cn("flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3 shadow-xs", muted && "bg-muted/40 shadow-none")}>
      <span
        aria-hidden="true"
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-(--label-light) shadow-xs dark:text-(--label-dark)", muted && "opacity-60")}
        style={swatch}
      >
        Aa
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm font-medium", muted && "text-muted-foreground")}>{name}</span>
        <span className="truncate text-xs text-muted-foreground tabular-nums uppercase">{hex}</span>
      </span>
      {actions ? <span className="flex shrink-0 items-center gap-1">{actions}</span> : null}
    </li>
  );
}
