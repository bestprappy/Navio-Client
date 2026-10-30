import { ArrowRight, MapPin } from "lucide-react";

import type { TripDestination } from "../constants/types";

/** The cities a day passes through, in order. Shown only when the day visits more than one. */
export function DayCityRoute({ cities }: { cities: readonly TripDestination[] }) {
  if (cities.length < 2) return null;
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 px-1 text-sm text-muted-foreground">
      <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="sr-only">Cities this day: </span>
      {cities.map((city, index) => (
        <span key={`${city.id}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <ArrowRight className="size-3.5 shrink-0" aria-label="then" /> : null}
          <span className="font-medium text-foreground">{city.name}</span>
        </span>
      ))}
    </p>
  );
}
