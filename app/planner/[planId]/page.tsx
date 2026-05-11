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
  await params;
  const { destinationName, from, to, lat, lng } = await searchParams;

  const latitude =
    lat !== undefined && Number.isFinite(Number(lat))
      ? Number(lat)
      : 13.7563;
  const longitude =
    lng !== undefined && Number.isFinite(Number(lng))
      ? Number(lng)
      : 100.5018;

  return (
    <PlannerDetail
      destinationName={destinationName ?? "your destination"}
      from={from}
      to={to}
      latitude={latitude}
      longitude={longitude}
    />
  );
}
