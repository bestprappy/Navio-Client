"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  communityFeedSortAtom,
} from "../_components/community-atoms";
import {
  CommunityApiError,
  toCommunityGroup,
} from "../_components/community-api";
import { useCommunityGroup } from "../_components/community-group-queries";
import { useCommunityFeed } from "../_components/community-queries";
import { CommunityErrorBoundary } from "../_components/community-error-boundary";
import {
  CommunityGroupLoading,
  CommunityQueryError,
} from "../_components/community-query-state";
import { CommunityFeed } from "../feed/community-feed";
import { CommunityGroupSidebar } from "./_components/community-group-sidebar";
import { CommunityGroupHeader } from "./_components/community-group-header";

export function CommunityGroupPage({ groupName }: { groupName: string }) {
  const detail = useCommunityGroup(groupName);
  const groups = useMemo(
    () => (detail.data ? [toCommunityGroup(detail.data)] : []),
    [detail.data],
  );
  const sort = useAtomValue(communityFeedSortAtom);
  const feed = useCommunityFeed("", sort, groupName);
  const group = groups[0];
  return (
    <CommunityErrorBoundary>
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 p-4 sm:p-6">
        {detail.isPending ? <CommunityGroupLoading /> : null}
        {detail.error instanceof CommunityApiError &&
        detail.error.status === 404 ? (
          <Card>
            <CardContent className="space-y-3 p-6">
              <h1 className="text-xl font-bold">Community not found</h1>
              <p className="text-sm text-muted-foreground">
                This community is unavailable or the address has changed.
              </p>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/community/discovery" />}
              >
                Browse communities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <CommunityQueryError
            error={detail.error}
            onRetry={() => void detail.refetch()}
          />
        )}
        {detail.data && group?.profile ? (
          <>
            <CommunityGroupHeader detail={detail.data} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="flex min-w-0 flex-col gap-4">
              <CommunityFeed
                posts={feed.data ?? []}
                groups={groups}
                searchQuery=""
                isLoading={feed.isLoading}
                isError={feed.isError}
              />
              {feed.hasNextPage ? <Button variant="outline" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>Load more posts</Button> : null}
              </div>
              <CommunityGroupSidebar group={group} profile={group.profile} />
            </div>
          </>
        ) : null}
      </div>
    </CommunityErrorBoundary>
  );
}
