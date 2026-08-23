import type { Metadata } from "next";

import { CommunityCreatePage } from "@/app/feature/community/_components/community-create-page";

export const metadata: Metadata = {
  title: "Create - Navio Community",
  description: "Start a discussion or create a new community group.",
};

type CommunityCreateRouteProps = {
  searchParams: Promise<{
    groupId?: string | string[];
    planId?: string | string[];
  }>;
};

function getSearchParamValue(value?: string | string[]): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function CommunityCreateRoute({
  searchParams,
}: CommunityCreateRouteProps) {
  const params = await searchParams;

  return (
    <CommunityCreatePage
      initialGroupId={getSearchParamValue(params.groupId)}
      initialPlanId={getSearchParamValue(params.planId)}
    />
  );
}
