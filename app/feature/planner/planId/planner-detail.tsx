"use client";

import { useHydrateAtoms } from "jotai/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { createGuestTrip, guestTripAtom, isGuestPlanner } from "../_components/guest-planner";
import { GuestPlanNotice } from "../_components/guest-plan-notice";
import { RecentPlanSidebarSync } from "../_components/recent-plan-sidebar-sync";

import { useTripMetadata } from "../_components/use-trip-metadata";
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
  country?: string;
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
  country,
  from,
  to,
  latitude,
  longitude,
  templatePlanId,
}: PlannerDetailProps) {
  const { isAuthenticated } = useRequireAuth();
  const guest = isGuestPlanner(planId, isAuthenticated);
  const today = new Date().toISOString().slice(0, 10);
  useHydrateAtoms([[guestTripAtom, guest ? createGuestTrip({
    destinationId: destinationId || "", destinationName,
    destinationLat: latitude, destinationLng: longitude,
    startDate: from || today, endDate: to || from || today,
  }, planId) : null]]);
  const metadata = useTripMetadata(planId);
  const tripDestinationName = metadata.data?.destinationName ?? destinationName;
  const tripLatitude = metadata.data?.destinationLat ?? latitude;
  const tripLongitude = metadata.data?.destinationLng ?? longitude;
  return (
    <GarageProvider>
    <PlannerWorkspace itinerary={<>
          {guest && <GuestPlanNotice />}
          <TripHero destinationName={tripDestinationName} />
          <TripInfoCard
            planId={planId}
            destinationName={tripDestinationName}
            from={from}
            to={to}
          />
          <ExploreSection
            destinationName={tripDestinationName}
            country={metadata.data?.destinationCountry ?? country ?? ""}
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
        guest={guest}
        planId={planId}
        templatePlanId={templatePlanId}
        from={from}
        to={to}
      />
      {!guest && isAuthenticated && <PlannerPersistence
        planId={planId}
        destinationId={destinationId}
        destinationName={destinationName}
        from={from}
        to={to}
        latitude={latitude}
        longitude={longitude}
        templatePlanId={templatePlanId}
      />}
      <RecentPlanSidebarSync planId={planId} />
      <DayNavSidebar />
    </PlannerWorkspace>
    </GarageProvider>
  );
}
