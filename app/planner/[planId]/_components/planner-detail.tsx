import { ExploreSection } from "./explore-section";
import { PlannerMap } from "./planner-map";
import { TripBuilder } from "./trip-builder";
import { TripBuilderErrorBoundary } from "./trip-builder-error-boundary";
import { TripHero } from "./trip-hero";
import { TripInfoCard } from "./trip-info-card";

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
      <div className="w-[55%] overflow-y-auto border-r border-border/40">
        <TripHero destinationName={destinationName} />
        <TripInfoCard
          destinationName={destinationName}
          from={from}
          to={to}
          members={[{ id: "1", name: "You" }]}
        />
        <ExploreSection
          destinationName={destinationName}
          distanceText={`Nearby ${destinationName}`}
        />
        <TripBuilderErrorBoundary>
          <TripBuilder />
        </TripBuilderErrorBoundary>
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
