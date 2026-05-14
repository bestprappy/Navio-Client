import type { Metadata } from "next";

import { getPlanById } from "@/app/feature/explore/_components/data";
import { PlanView } from "@/app/feature/explore/view/[id]/[slug]/_components/plan-view";

type PlanViewPageProps = {
  params: { id: string; slug: string };
};

export function generateMetadata({ params }: PlanViewPageProps): Metadata {
  const plan = getPlanById(params.id);
  return {
    title: plan ? `${plan.title} - Navio` : "Plan details - Navio",
    description: plan?.description ?? "Trip details and highlights.",
  };
}

export default function PlanViewPage({ params }: PlanViewPageProps) {
  const plan = getPlanById(params.id);

  return <PlanView plan={plan} />;
}
