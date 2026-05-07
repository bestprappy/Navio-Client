import type { Metadata } from "next";

import { getDestinationById } from "../_components/data";
import { PlannerDetail } from "./_components/planner-detail";

type PlannerDetailPageProps = {
  params: Promise<{
    planId?: string;
  }>;
  searchParams: Promise<{
    destinationId?: string;
    destinationName?: string;
    from?: string;
    to?: string;
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
  const { destinationId, destinationName, from, to } = await searchParams;

  const destination = getDestinationById(destinationId);
  const resolvedName =
    destinationName ?? destination?.name ?? "your destination";
  const coordinates = destination?.coordinates ?? {
    latitude: 13.7563,
    longitude: 100.5018,
  };

  return (
    <PlannerDetail
      destinationName={resolvedName}
      from={from}
      to={to}
      latitude={coordinates.latitude}
      longitude={coordinates.longitude}
    />
  );
}
