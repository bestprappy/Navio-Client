import type { Metadata } from "next";

import { CommunityGroupPage } from "@/app/feature/community/groupname/community-group-page";
type CommunityGroupRouteProps = {
  params: Promise<{
    groupname: string;
  }>;
};

export const metadata: Metadata = {
  title: "Group - Navio Community",
  description: "View community posts, rules, resources, and moderators.",
};

export default async function CommunityGroupRoute({
  params,
}: CommunityGroupRouteProps) {
  const { groupname } = await params;

  return <CommunityGroupPage groupName={groupname} />;
}
