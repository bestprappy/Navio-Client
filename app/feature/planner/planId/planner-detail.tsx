import { ExploreSection } from "./_components/explore/explore-section";
import { ItinerarySection } from "./_components/itinerary/itinerary-section";

import { BudgetSection } from "./_components/budget/budget-section";
import { TripBuilderErrorBoundary } from "./_components/overview/trip-builder-error-boundary";
import { TripHero } from "./_components/overview/trip-hero";
import { TripInfoCard } from "./_components/overview/trip-info-card";
import { PlannerMap } from "./planner-map";

type PlannerDetailProps = {
  destinationName: string;
  from?: string;
  to?: string;
  latitude: number;
  longitude: number;
};

export function PlannerDetail({
  destinationName,
  from,
  to,
  latitude,
  longitude,
}: PlannerDetailProps) {
  return (
    <div className="flex h-full">
      {/* Left: scrollable planner panel */}
      <div className="scrollbar-hide w-[40%] overflow-y-auto border-r border-border/40">
        <TripHero destinationName={destinationName} />
        <TripInfoCard
          destinationName={destinationName}
          from={from}
          to={to}
          members={[{ id: "1", name: "You" }]}
        />
        {/* Explore Section */}
        <ExploreSection
          destinationName={destinationName}
          distanceText={`Nearby ${destinationName}`}
        />
        {/* Itinerary Section */}
        <TripBuilderErrorBoundary>
          <ItinerarySection />
        </TripBuilderErrorBoundary>

        {/* Budget Sections */}
        <BudgetSection />
      </div>

      {/* Right: full-height map */}
      <div className="flex-1">
        <TripBuilderErrorBoundary>
          <PlannerMap latitude={latitude} longitude={longitude} />
        </TripBuilderErrorBoundary>
      </div>
    </div>
  );
}
