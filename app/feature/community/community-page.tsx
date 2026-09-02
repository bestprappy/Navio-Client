"use client";

import { useAtom, useAtomValue } from "jotai";

import {
  communityFeedSortAtom,
  communitySearchQueryAtom,
  createdGroupsAtom,
  createdPostsAtom,
  extraCommentsByPostIdAtom,
  joinedGroupIdsAtom,
  selectedCommunityPostIdAtom,
} from "./_components/community-atoms";
import { CommunityContextSidebar } from "./feed/community-context-sidebar";
import { CommunityErrorBoundary } from "./_components/community-error-boundary";
import { CommunityFeed } from "./feed/community-feed";
import { mockCommunityGroups } from "./_components/data";
import {
  useCommunityFeed,
  useCommunityGroups,
} from "./_components/community-queries";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function CommunityPage() {
  const { requireAuth } = useRequireAuth();
  const searchQuery = useAtomValue(communitySearchQueryAtom);
  const sort = useAtomValue(communityFeedSortAtom);
  const createdGroups = useAtomValue(createdGroupsAtom);
  const createdPosts = useAtomValue(createdPostsAtom);
  const extraCommentsByPostId = useAtomValue(extraCommentsByPostIdAtom);
  const [joinedGroupIds, setJoinedGroupIds] = useAtom(joinedGroupIdsAtom);
  const [selectedPostId, setSelectedPostId] = useAtom(
    selectedCommunityPostIdAtom,
  );

  const groupsQuery = useCommunityGroups(searchQuery, createdGroups);
  const groups = groupsQuery.data ?? [...createdGroups, ...mockCommunityGroups];
  const feedQuery = useCommunityFeed(
    searchQuery,
    sort,
    createdPosts,
    groups,
    extraCommentsByPostId,
  );

  function toggleJoin(groupId: string) {
    requireAuth(() => {
      setJoinedGroupIds((previous) =>
        previous.includes(groupId)
          ? previous.filter((id) => id !== groupId)
          : [...previous, groupId],
      );
    });
  }

  return (
    <CommunityErrorBoundary>
      <div className="min-h-full bg-background">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 p-4 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <CommunityFeed
              posts={feedQuery.data ?? []}
              groups={groups}
              extraCommentsByPostId={extraCommentsByPostId}
              searchQuery={searchQuery}
              selectedPostId={selectedPostId}
              isLoading={feedQuery.isLoading}
              isError={feedQuery.isError}
              onSelectPost={setSelectedPostId}
            />

            <CommunityContextSidebar
              groups={groups}
              joinedGroupIds={joinedGroupIds}
              groupsLoading={groupsQuery.isLoading}
              groupsError={groupsQuery.isError}
              onToggleJoin={toggleJoin}
            />
          </div>
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}
