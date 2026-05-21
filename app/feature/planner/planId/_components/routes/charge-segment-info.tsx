import { Battery, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

type ChargeSegmentInfoProps = {
  batteryFrom?: number;
  batteryTo?: number;
};

export function ChargeSegmentInfo({ batteryFrom, batteryTo }: ChargeSegmentInfoProps) {
  if (batteryFrom === undefined || batteryTo === undefined) return null;

  return (
    <div className="rounded-sm border border-primary/20 bg-primary/5 px-3 py-2 shadow-xs">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <Zap className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Charge</span>
        </div>
        <span
          className="tabular-nums text-primary"
          aria-label={`Charged from ${batteryFrom.toFixed(0)}% to ${batteryTo.toFixed(0)}%`}
        >
          {batteryFrom.toFixed(0)}%&nbsp;→&nbsp;{batteryTo.toFixed(0)}%
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15"
        role="progressbar"
        aria-valuenow={batteryTo}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${batteryTo}%` }}
        />
      </div>
    </div>
  );
}

type DischargeSegmentInfoProps = {
  batteryFrom?: number;
  batteryTo?: number;
};

export function DischargeSegmentInfo({
  batteryFrom,
  batteryTo,
}: DischargeSegmentInfoProps) {
  if (batteryFrom === undefined || batteryTo === undefined) return null;

  const isLow = batteryTo < 20;

  return (
    <div className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm shadow-xs">
      <Battery
        className={cn("size-3.5 shrink-0", isLow ? "text-destructive" : "text-amber-500")}
        aria-hidden="true"
      />
      <span
        className={cn("tabular-nums", isLow ? "text-destructive" : "text-muted-foreground")}
        aria-label={`Battery from ${batteryFrom.toFixed(0)}% to ${batteryTo.toFixed(0)}%`}
      >
        {batteryFrom.toFixed(0)}%&nbsp;→&nbsp;{batteryTo.toFixed(0)}%
      </span>
    </div>
  );
}
