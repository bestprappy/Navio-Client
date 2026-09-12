"use client";

import { useTripMetadata } from "../_components/use-trip-metadata";
import { getTripCountry } from "../_components/trip-destinations";
import { PlannerWorkspace } from "./_components/layout/planner-workspace";
import { ExploreSection } from "./_components/explore/explore-section";
import { GarageSection } from "./_components/garage/garage-section";
import { GarageProvider } from "./_components/garage/garage-provider";
import { DayNavSidebar } from "./_components/itinerary/day-nav-sidebar";
import { ItinerarySection } from "./_components/itinerary/itinerary-section";
import { MyListSection } from "./_components/list/my-list-section";
import { BudgetSection } from "./_components/budget/budget-section";
import { TripBuilderErrorBoundary } from "./_components/overview/trip-builder-error-boundary";
import { PlannerTemplateHydrator } from "./_components/overview/planner-template-hydrator";
import { PlannerPersistence } from "./_components/overview/planner-persistence";
import { TripHero } from "./_components/overview/trip-hero";
import { TripInfoCard } from "./_components/overview/trip-info-card";
import { PlannerSidePanelHost } from "./_components/layout/planner-side-panel-host";
import { PlannerMap } from "./planner-map";

type PlannerDetailProps = {
  planId?: string;
  destinationId?: string;
  destinationName: string;
  from?: string;
  to?: string;
  latitude: number;
  longitude: number;
  templatePlanId?: string;
};

export function PlannerDetail({
  planId,
  destinationId,
  destinationName,
  from,
  to,
  latitude,
  longitude,
  templatePlanId,
}: PlannerDetailProps) {
  const metadata = useTripMetadata(planId);
  const tripDestinationName = metadata.data?.destinationName ?? destinationName;
  const tripLatitude = metadata.data?.destinationLat ?? latitude;
  const tripLongitude = metadata.data?.destinationLng ?? longitude;
  return (
    <GarageProvider>
    <PlannerWorkspace itinerary={<>
          <TripHero destinationName={tripDestinationName} />
          <TripInfoCard
            planId={planId}
            destinationName={tripDestinationName}
            from={from}
            to={to}
            members={[{ id: "1", name: "You" }]}
          />
          <ExploreSection
            destinationName={tripDestinationName}
            country={getTripCountry({ destinationName: tripDestinationName, destinationCountry: metadata.data?.destinationCountry ?? null })}
          />

          <TripBuilderErrorBoundary>
            <GarageSection />
          </TripBuilderErrorBoundary>

          <TripBuilderErrorBoundary>
            <MyListSection
              destinationName={tripDestinationName}
              latitude={tripLatitude}
              longitude={tripLongitude}
              createDefaultList={!templatePlanId}
            />
          </TripBuilderErrorBoundary>

          <TripBuilderErrorBoundary>
            <ItinerarySection
              destinationName={tripDestinationName}
              latitude={tripLatitude}
              longitude={tripLongitude}
            />
          </TripBuilderErrorBoundary>
          <BudgetSection />

</>} map={<TripBuilderErrorBoundary><PlannerMap latitude={tripLatitude} longitude={tripLongitude} /></TripBuilderErrorBoundary>} details={<PlannerSidePanelHost />}>
      <PlannerTemplateHydrator
        planId={planId}
        templatePlanId={templatePlanId}
        from={from}
        to={to}
      />
      <PlannerPersistence
        planId={planId}
        destinationId={destinationId}
        destinationName={destinationName}
        from={from}
        to={to}
        latitude={latitude}
        longitude={longitude}
        templatePlanId={templatePlanId}
      />
      <DayNavSidebar />
    </PlannerWorkspace>
    </GarageProvider>
  );
}
