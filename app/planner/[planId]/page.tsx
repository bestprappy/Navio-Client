import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PlannerDetail } from "../../feature/planner/planId/planner-detail";
import { isPersistedTripId } from "@/app/feature/planner/_components/planner-api";

type PlannerDetailPageProps = {
  params: Promise<{
    planId?: string;
  }>;
  searchParams: Promise<{
    destinationId?: string;
    destinationName?: string;
    country?: string;
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
  if (!isPersistedTripId(planId)) redirect("/planner/new");
  const { destinationId, destinationName, country, from, to, lat, lng, templatePlanId } =
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
      country={country}
      from={from}
      to={to}
      latitude={latitude}
      longitude={longitude}
      templatePlanId={templatePlanId}
    />
  );
}
