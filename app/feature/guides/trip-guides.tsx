"use client";

import { useMemo } from "react";
import type { TripBlockData } from "../planner/planId/_components/constants/types";
import { GuideDiscovery } from "./guide-discovery";
import { tripGuideDiscoveryScopes } from "./trip-guide-destinations";

export function TripGuides({
  initial,
  blocks,
  country,
}: {
  initial: string;
  blocks: readonly TripBlockData[];
  country?: string;
}) {
  const destinations = useMemo(
    () => tripGuideDiscoveryScopes(initial, blocks, country),
    [initial, blocks, country],
  );
  return (
    <div className="mt-8 min-w-0 space-y-6 border-t border-border pt-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Guides for your trip</h3>
        <p className="text-sm text-muted-foreground">
          Places and tips from travelers across the countries you visit.
        </p>
      </div>
      {destinations.map((destination) => (
        <section
          key={destination.key}
          aria-label={`Guides for ${destination.name}`}
          className="min-w-0"
        >
          <GuideDiscovery
            filter={destination.filter}
            carouselTitle={destination.name}
          />
        </section>
      ))}
    </div>
  );
}
