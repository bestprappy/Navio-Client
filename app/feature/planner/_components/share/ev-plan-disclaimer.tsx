import { Zap } from "lucide-react";

import type { PublicPlanSnapshot } from "./publication-api";

/**
 * True when any day in the snapshot has a charging stop.
 *
 * <p>Charger name, location, and stop order are intentionally public (see
 * {@code PlanPublicationSanitizer}), but an ordered sequence of charger pins reads
 * as a route recommendation to a stranger even without a battery percentage next
 * to it. This flag decides whether the plan needs the disclaimer below.
 */
export function hasChargerStops(plan: Pick<PublicPlanSnapshot, "days">): boolean {
  return plan.days?.some((day) => day.items?.some((item) => item.type === "charger")) ?? false;
}

/**
 * Persistent label shown wherever a shared plan's charging stops render.
 *
 * <p>The sanitizer already strips battery percentage, target state of charge, and
 * charge-time estimates, so no vehicle-specific number reaches this page. What
 * remains — charger identity, location, and order — was still chosen for the
 * original traveler's vehicle and range. Silence here would let a viewer assume
 * the sequence fits their own EV; this label says otherwise every time the
 * sequence is visible, not just once in a dismissible tooltip.
 */
export function EvPlanDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground ${className ?? ""}`}
    >
      <Zap className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Charging stops were planned for the original traveler&apos;s vehicle and range. They may not
        suit yours — check them against your own EV before you go.
      </span>
    </p>
  );
}
