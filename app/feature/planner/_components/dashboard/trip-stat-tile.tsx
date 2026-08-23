import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type TripStatTileProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  isLoading?: boolean;
  className?: string;
};

export function TripStatTile({
  icon: Icon,
  label,
  value,
  hint,
  isLoading = false,
  className,
}: TripStatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[var(--card-radius-lg)] border border-border/60 bg-background/60 p-4",
        "shadow-2xs transition-shadow duration-200 hover:shadow-sm",
        className,
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </span>
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-6 w-20 animate-pulse rounded-[var(--radius-xs)] bg-muted"
        />
      ) : (
        <span className="text-lg leading-tight font-bold text-foreground">
          {value}
        </span>
      )}
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}
