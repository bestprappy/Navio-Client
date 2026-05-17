import type { Metadata } from "next";

import { CommunityDiscussionPage } from "@/app/feature/community/groupname/community-discussion-page";
import {
  getCommunityPostSlug,
  getGroupById,
  getGroupBySlug,
  getPostByGroupAndSlug,
  mockCommunityGroups,
  mockCommunityPosts,
  slugifyCommunityValue,
} from "@/app/feature/community/_components/data";

type CommunityDiscussionRouteProps = {
  params: Promise<{
    groupname: string;
    discussionTitle: string;
  }>;
};

export async function generateMetadata({
  params,
}: CommunityDiscussionRouteProps): Promise<Metadata> {
  const { groupname, discussionTitle } = await params;
  const group = getGroupBySlug(groupname);
  const post = group
    ? getPostByGroupAndSlug(group.id, discussionTitle, mockCommunityPosts)
    : null;

  return {
    title:
      group && post
        ? `${post.title} - ${group.name} - Navio Community`
        : "Discussion - Navio Community",
    description:
      post?.body ??
      group?.description ??
      "Read and reply to a Navio community discussion.",
  };
}

export function generateStaticParams() {
  const paramsByKey = new Map<
    string,
    { groupname: string; discussionTitle: string }
  >();

  mockCommunityPosts.forEach((post) => {
    const group = getGroupById(post.groupId, mockCommunityGroups);

    if (!group) {
      return;
    }

    const params = {
      groupname: slugifyCommunityValue(group.name),
      discussionTitle: getCommunityPostSlug(post),
    };

    paramsByKey.set(`${params.groupname}/${params.discussionTitle}`, params);
  });

  return Array.from(paramsByKey.values());
}

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
