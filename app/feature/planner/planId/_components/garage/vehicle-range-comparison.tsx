"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { EvCar } from "../constants/vehicle.types";
import { baseRangeKm, planningRangeKm, rangeReductionPct, rangeRetention } from "./energy-policy";
import { energyModelForCar } from "./trip-energy-projection";
import { energyDisplayNumber } from "./energy-display";

/** Factory specifications and the calculation in use are separate, even for custom/observed vehicles. */
export function VehicleRangeComparison({ car, planningCar = car }: { car: EvCar; planningCar?: EvCar }) {
  const model = energyModelForCar(planningCar);
  const reduction = rangeReductionPct(model);
  const planned = planningRangeKm(model);
  const base = baseRangeKm(model);
  const observed = model.modelKind === "CONSUMPTION" && model.consumptionSource === "USER_OBSERVED";
  const standard = car.rangeStandard ?? car.energyProfile?.ratedRangeStandard;
  const reference = Number.isFinite(car.rangeKm) && car.rangeKm > 0 ? car.rangeKm : null;
  const width = planned !== null && base !== null ? Math.max(0, Math.min(100, planned / base * 100)) : 0;

  return (
    <section aria-label="Factory and Navio range comparison" className="border-t border-border px-4 pt-4 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Range used for this trip</h3>
        <Badge variant="outline" className="text-foreground">{planned === null ? "Needs vehicle data" : reduction > 0 ? `${reduction}% planning allowance` : observed ? "Your observed average" : "Unconfirmed basis"}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">{standard === "User supplied" || standard === "NONE" ? "Reference range" : "Factory range"}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{energyDisplayNumber(reference, " km")}</dd>
          {standard && standard !== "NONE" && <p className="mt-1 text-xs text-muted-foreground">{standard}</p>}
        </div>
        <div className="min-w-0 text-right">
          <dt className="text-xs text-muted-foreground">Navio planning range</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-primary">{energyDisplayNumber(planned, " km")}</dd>
          <p className="mt-1 text-xs text-muted-foreground">At 100% battery</p>
        </div>
      </dl>
      {planned !== null && base !== null && <>
        {model.modelKind === "RATED_RANGE" && <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
        </div>}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {model.modelKind === "RATED_RANGE"
            ? `${energyDisplayNumber(base, " km")} × ${rangeRetention(model)} = ${energyDisplayNumber(planned, " km")}.`
            : `${energyDisplayNumber(model.consumptionKwhPer100km, " kWh/100 km")} ${observed ? "observed" : "base"}${reduction > 0 ? ` → ${energyDisplayNumber(model.consumptionKwhPer100km === null ? null : model.consumptionKwhPer100km / rangeRetention(model), " kWh/100 km")} for planning (${energyDisplayNumber(base, " km")} → ${energyDisplayNumber(planned, " km")})` : "; no additional reduction"}.`}
        </p>
      </>}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Declared battery: {Number.isFinite(car.batteryKwh) && car.batteryKwh > 0 ? `${car.batteryKwh.toLocaleString("en-US", {maximumFractionDigits:3})} kWh` : "Unavailable"}. Battery capacity stays unchanged.</p>
      <Accordion>
        <AccordionItem value="range-basis" className="border-0">
          <AccordionTrigger className="text-xs text-foreground">How this estimate works</AccordionTrigger>
          <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
            <p>Factory-based estimates include a 20% road-trip range allowance across all supported EVs and test standards. This is a planning assumption, not a measured loss or a guaranteed road range. EPA labels already include test adjustments; this allowance is additional trip headroom.</p>
            <p>Factory range and battery specifications are preserved. Consumption-based estimates use battery capacity and the selected consumption figure. Your observed average already reflects your driving, so no extra reduction is applied. Unconfirmed consumption remains labelled until you choose a source.</p>
            <p>Speed, temperature, hills, load and air conditioning can change actual range. The battery threshold controls charging stops separately.</p>
            <a href="https://doi.org/10.3390/wevj16030124" target="_blank" rel="noreferrer">Research on driving cycles and EV range (opens in a new tab)</a>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
