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
} from "./community-atoms";
import { CommunityContextSidebar } from "./community-context-sidebar";
import { CommunityErrorBoundary } from "./community-error-boundary";
import { CommunityFeed } from "./community-feed";
import { getGroupById, mockCommunityGroups, mockCommunityPosts } from "./data";
import { useCommunityFeed, useCommunityGroups } from "./community-queries";

export function CommunityPage() {
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
  const allPosts = [...createdPosts, ...mockCommunityPosts];
  const selectedPost =
    allPosts.find((post) => post.id === selectedPostId) ?? null;
  const selectedGroup = selectedPost
    ? getGroupById(selectedPost.groupId, groups)
    : null;

  function toggleJoin(groupId: string) {
    setJoinedGroupIds((previous) =>
      previous.includes(groupId)
        ? previous.filter((id) => id !== groupId)
        : [...previous, groupId],
    );
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
