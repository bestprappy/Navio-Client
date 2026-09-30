"use client";

import { useId } from "react";
import { useAtom } from "jotai";

import { cn } from "@/lib/utils";

import { ARRIVAL_RESERVE_OPTIONS, arrivalReservePctAtom } from "./garage.atoms";

type ArrivalReserveControlProps = {
  disabled?: boolean;
  className?: string;
};

/** Segmented choice of the battery to keep on arrival; native radios keep arrow-key navigation. */
export function ArrivalReserveControl({ disabled = false, className }: ArrivalReserveControlProps) {
  const name = useId();
  const helpId = `${name}-help`;
  const [reservePct, setReservePct] = useAtom(arrivalReservePctAtom);

  return (
    <fieldset className={cn("min-w-0", className)} disabled={disabled} aria-describedby={helpId}>
      <legend className="text-sm font-medium text-foreground">Arrive with at least</legend>
      <div className="mt-2 grid grid-cols-4 gap-1 rounded-sm bg-background p-1 ring-1 ring-border">
        {ARRIVAL_RESERVE_OPTIONS.map((pct) => (
          <label key={pct} className="min-w-0">
            <input
              type="radio"
              name={name}
              value={pct}
              checked={reservePct === pct}
              onChange={() => setReservePct(pct)}
              className="peer sr-only"
            />
            <span className="flex h-8 cursor-pointer items-center justify-center rounded-sm text-sm font-medium tabular-nums text-muted-foreground transition-colors hover:text-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
              {pct}%
            </span>
          </label>
        ))}
      </div>
      <p id={helpId} className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Charging stops are planned so no leg ends below this. It also sets the reserve line on battery estimates.
      </p>
    </fieldset>
  );
}
