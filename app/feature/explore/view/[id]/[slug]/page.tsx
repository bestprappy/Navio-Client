import type { Metadata } from "next";

import { getPlanById } from "../../../_components/data";
import { PlanView } from "./_components/plan-view";

type PlanViewPageProps = {
  params: Promise<{ id: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PlanViewPageProps): Promise<Metadata> {
  const { id } = await params;
  const plan = getPlanById(id);
  return {
    title: plan ? `${plan.title} - Navio` : "Plan details - Navio",
    description: plan?.description ?? "Trip details and highlights.",
  };
}

export default async function PlanViewPage({ params }: PlanViewPageProps) {
  const { id } = await params;
  const plan = getPlanById(id);

  return <PlanView plan={plan} />;
}
