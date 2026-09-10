"use client";

import { useAtom, useAtomValue } from "jotai";

import {
  communityFeedSortAtom,
  communitySearchQueryAtom,
  createdPostsAtom,
  extraCommentsByPostIdAtom,
  selectedCommunityPostIdAtom,
} from "./_components/community-atoms";
import { CommunityContextSidebar } from "./feed/community-context-sidebar";
import { CommunityErrorBoundary } from "./_components/community-error-boundary";
import { CommunityWorkspace } from "./_components/community-workspace";
import { CommunityFeed } from "./feed/community-feed";
import {
  useCommunityFeed,
  useCommunityGroups,
} from "./_components/community-queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CommunityGroupDialog } from "./create/community-group-dialog";
import { CommunityQueryError } from "./_components/community-query-state";

export function CommunityPage() {
  const searchQuery = useAtomValue(communitySearchQueryAtom);
  const sort = useAtomValue(communityFeedSortAtom);
  const createdPosts = useAtomValue(createdPostsAtom);
  const extraCommentsByPostId = useAtomValue(extraCommentsByPostIdAtom);
  const [selectedPostId, setSelectedPostId] = useAtom(
    selectedCommunityPostIdAtom,
  );

  const groupsQuery = useCommunityGroups(searchQuery);
  const groups = groupsQuery.data;
  const feedQuery = useCommunityFeed(
    searchQuery,
    sort,
    createdPosts,
    groups,
    extraCommentsByPostId,
  );

  return (
    <CommunityErrorBoundary>
      <CommunityWorkspace>
        <CommunityWorkspace.Content>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/community/discovery" />}
            >
              Discover communities
            </Button>
            <CommunityGroupDialog />
          </div>
          <CommunityQueryError
            error={groupsQuery.error}
            onRetry={() => void groupsQuery.refetch()}
          />
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
          {groupsQuery.hasNextPage ? (
            <Button
              variant="outline"
              disabled={groupsQuery.isFetchingNextPage}
              onClick={() => void groupsQuery.fetchNextPage()}
            >
              Load more communities
            </Button>
          ) : null}
        </CommunityWorkspace.Content>
        <CommunityWorkspace.Aside>
          <CommunityContextSidebar
            groups={groups}
            joinedGroupIds={groups
              .filter((group) => group.joined)
              .map((group) => group.id)}
            groupsLoading={groupsQuery.isLoading}
            groupsError={groupsQuery.isError}
          />
        </CommunityWorkspace.Aside>
      </CommunityWorkspace>
    </CommunityErrorBoundary>
  );
}
