import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CommunityCreatePage } from "@/app/feature/community/_components/community-create-page";
import { auth } from "@/auth";
import { getSignInHref } from "@/lib/auth-navigation";

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
  const session = await auth();

  if (!session?.user || session.error) {
    const query = new URLSearchParams();
    const groupId = getSearchParamValue(params.groupId);
    const planId = getSearchParamValue(params.planId);
    if (groupId) query.set("groupId", groupId);
    if (planId) query.set("planId", planId);
    const callbackUrl = query.size
      ? `/community/create?${query.toString()}`
      : "/community/create";
    redirect(getSignInHref(callbackUrl));
  }

  return (
    <CommunityCreatePage
      initialGroupId={getSearchParamValue(params.groupId)}
      initialPlanId={getSearchParamValue(params.planId)}
    />
  );
}
