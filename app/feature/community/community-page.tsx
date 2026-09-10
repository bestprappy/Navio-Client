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
      <div className="min-h-full bg-background">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 p-4 sm:p-6">
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
              joinedGroupIds={groups
                .filter((group) => group.joined)
                .map((group) => group.id)}
              groupsLoading={groupsQuery.isLoading}
              groupsError={groupsQuery.isError}
            />
          </div>
          {groupsQuery.hasNextPage ? (
            <Button
              variant="outline"
              disabled={groupsQuery.isFetchingNextPage}
              onClick={() => void groupsQuery.fetchNextPage()}
            >
              Load more communities
            </Button>
          ) : null}
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}
