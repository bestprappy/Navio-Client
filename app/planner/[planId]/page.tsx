import type { Metadata } from "next";

import { PlannerDetail } from "../../feature/planner/planId/planner-detail";

type PlannerDetailPageProps = {
  params: Promise<{
    planId?: string;
  }>;
  searchParams: Promise<{
    destinationId?: string;
    destinationName?: string;
    from?: string;
    to?: string;
    lat?: string;
    lng?: string;
    templatePlanId?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Trip planner - Navio",
  description: "Plan your trip itinerary alongside an interactive map.",
};

export default async function PlannerDetailPage({
  params,
  searchParams,
}: PlannerDetailPageProps) {
  const { planId } = await params;
  const { destinationId, destinationName, from, to, lat, lng, templatePlanId } =
    await searchParams;

  const latitude =
    lat !== undefined && Number.isFinite(Number(lat)) ? Number(lat) : 13.7563;
  const longitude =
    lng !== undefined && Number.isFinite(Number(lng)) ? Number(lng) : 100.5018;

  return (
    <PlannerDetail
      planId={planId}
      destinationId={destinationId}
      destinationName={destinationName ?? "your destination"}
      from={from}
      to={to}
      latitude={latitude}
      longitude={longitude}
      templatePlanId={templatePlanId}
    />
  );
}
