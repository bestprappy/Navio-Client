import type { Metadata } from "next";

import { CommunityGroupPage } from "@/app/feature/community/groupname/community-group-page";
import {
  getGroupBySlug,
  mockCommunityGroups,
  slugifyCommunityValue,
} from "@/app/feature/community/_components/data";

type CommunityGroupRouteProps = {
  params: Promise<{
    groupname: string;
  }>;
};

export async function generateMetadata({
  params,
}: CommunityGroupRouteProps): Promise<Metadata> {
  const { groupname } = await params;
  const group = getGroupBySlug(groupname);

  return {
    title: group
      ? `${group.name} - Navio Community`
      : "Group - Navio Community",
    description:
      group?.description ??
      "View group posts, rules, flairs, moderators, and activity on Navio Community.",
  };
}

export function generateStaticParams() {
  return mockCommunityGroups.map((group) => ({
    groupname: slugifyCommunityValue(group.name),
  }));
}

export default async function CommunityGroupRoute({
  params,
}: CommunityGroupRouteProps) {
  const { groupname } = await params;

  return <CommunityGroupPage groupName={groupname} />;
}
