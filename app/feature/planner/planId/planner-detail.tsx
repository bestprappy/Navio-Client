import { ExploreSection } from "./_components/explore/explore-section";
import { GarageSection } from "./_components/garage/garage-section";
import { DayNavSidebar } from "./_components/itinerary/day-nav-sidebar";
import { ItinerarySection } from "./_components/itinerary/itinerary-section";
import { MyListSection } from "./_components/list/my-list-section";
import { BudgetSection } from "./_components/budget/budget-section";
import { TripBuilderErrorBoundary } from "./_components/overview/trip-builder-error-boundary";
import { PlannerTemplateHydrator } from "./_components/overview/planner-template-hydrator";
import { TripHero } from "./_components/overview/trip-hero";
import { TripInfoCard } from "./_components/overview/trip-info-card";
import { PlannerSidePanelHost } from "./_components/layout/planner-side-panel-host";
import { PlannerMap } from "./planner-map";

type PlannerDetailProps = {
  destinationName: string;
  from?: string;
  to?: string;
  latitude: number;
  longitude: number;
  templatePlanId?: string;
};

export function PlannerDetail({
  destinationName,
  from,
  to,
  latitude,
  longitude,
  templatePlanId,
}: PlannerDetailProps) {
  return (
    <div className="flex h-full min-w-0">
      <PlannerTemplateHydrator
        templatePlanId={templatePlanId}
        from={from}
        to={to}
      />
      {/* Left: day nav + scrollable planner panel */}
      <div className="flex w-[38%] border-r border-border/40">
        <DayNavSidebar />

        <div
          id="planner-scroll-panel"
          className="scrollbar-hide flex-1 overflow-y-auto"
        >
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
            <GarageSection />
          </TripBuilderErrorBoundary>

          <TripBuilderErrorBoundary>
            <MyListSection
              destinationName={destinationName}
              latitude={latitude}
              longitude={longitude}
              createDefaultList={!templatePlanId}
            />
          </TripBuilderErrorBoundary>

          <TripBuilderErrorBoundary>
            <ItinerarySection
              destinationName={destinationName}
              latitude={latitude}
              longitude={longitude}
            />
          </TripBuilderErrorBoundary>
          <BudgetSection />
        </div>
      </div>

      {/* Center: full-height map */}
      <div className="min-w-0 flex-1">
        <TripBuilderErrorBoundary>
          <PlannerMap latitude={latitude} longitude={longitude} />
        </TripBuilderErrorBoundary>
      </div>

      {/* Right: EV side panel — pushes map when open */}
      <PlannerSidePanelHost />
    </div>
  );
}
