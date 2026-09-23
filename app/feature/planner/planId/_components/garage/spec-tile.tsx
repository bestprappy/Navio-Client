import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SpecTileTone = "primary" | "charging" | "warning" | "premade" | "rating";

/**
 * One hue per spec so neighbours read apart at a glance; all from existing feature tokens.
 * Light mode uses a paler wash: the tokens are dark there, and a strong tint of them goes muddy.
 */
const SPEC_TILE_TONES: Record<SpecTileTone, string> = {
  primary: "bg-primary/10 text-primary ring-primary/30 dark:bg-primary/20 dark:ring-primary/45",
  charging: "bg-charging/10 text-charging ring-charging/30 dark:bg-charging/20 dark:ring-charging/45",
  warning: "bg-warning/10 text-warning ring-warning/30 dark:bg-warning/20 dark:ring-warning/45",
  premade: "bg-premade/10 text-premade ring-premade/30 dark:bg-premade/20 dark:ring-premade/45",
  // Rating is a light yellow in both themes, so its icon needs the deeper warning hue on white.
  rating: "bg-rating/20 text-warning ring-rating/60 dark:text-rating dark:ring-rating/45",
};

type SpecTileProps = {
  icon: LucideIcon;
  tone: SpecTileTone;
  label: string;
  value: string;
  unit?: string;
  /** Secondary line under the value, such as an estimate derived from it. */
  detail?: string;
};

/** Icon, label and value for one spec; render inside a `<dl>`. */
export function SpecTile({ icon: Icon, tone, label, value, unit, detail }: SpecTileProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg bg-muted/50 p-2">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md ring-1 ring-inset", SPEC_TILE_TONES[tone])} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="truncate text-xs text-muted-foreground">{label}</dt>
        <dd className="text-base font-semibold leading-tight tabular-nums text-foreground">
          {value}
          {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
        </dd>
        {detail && <dd className="truncate text-xs text-muted-foreground">{detail}</dd>}
      </div>
    </div>
  );
}
