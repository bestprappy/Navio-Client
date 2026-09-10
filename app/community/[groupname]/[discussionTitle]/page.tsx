import type { Metadata } from "next";

import { CommunityDiscussionPage } from "@/app/feature/community/groupname/community-discussion-page";
type CommunityDiscussionRouteProps = {
  params: Promise<{
    groupname: string;
    discussionTitle: string;
  }>;
};

export const metadata: Metadata = {
  title: "Discussion preview - Navio Community",
  description: "Preview a local community discussion.",
  robots: { index: false, follow: false },
};

export default async function CommunityDiscussionRoute({
  params,
}: CommunityDiscussionRouteProps) {
  const { groupname, discussionTitle } = await params;

  return (
    <CommunityDiscussionPage
      groupName={groupname}
      discussionTitle={discussionTitle}
    />
  );
}
