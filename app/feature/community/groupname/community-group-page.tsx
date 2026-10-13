"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAtom } from "jotai";
import { Compass, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { groupFeedSortAtom } from "../_components/community-atoms";
import { CommunityApiError, toCommunityGroup } from "../_components/community-api";
import { useCommunityGroup } from "../_components/community-group-queries";
import { useCommunityFeed } from "../_components/community-queries";
import { CommunityErrorBoundary } from "../_components/community-error-boundary";
import { CommunityGroupLoading, CommunityQueryError } from "../_components/community-query-state";
import { CommunityMembershipButton } from "../_components/community-membership-button";
import { CommunityFeed } from "../feed/community-feed";
import { EmptyFeed } from "../_components/community-empty-state";
import { CommunityGroupSidebar } from "./_components/community-group-sidebar";
import { CommunityGroupHeader } from "./_components/community-group-header";

export function CommunityGroupPage({ groupName }: { groupName: string }) {
  const detail = useCommunityGroup(groupName);
  const group = useMemo(() => (detail.data ? toCommunityGroup(detail.data) : null), [detail.data]);
  const groups = useMemo(() => (group ? [group] : []), [group]);
  const [sort, setSort] = useAtom(groupFeedSortAtom);
  const feed = useCommunityFeed("", sort, groupName);
  const notFound = detail.error instanceof CommunityApiError && detail.error.status === 404;

  return (
    <CommunityErrorBoundary>
      <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
        {detail.isPending ? <CommunityGroupLoading /> : null}
        {notFound ? (
          <EmptyFeed
            title="Community not found"
            body="This community is unavailable or its address has changed."
            actions={
              <Button nativeButton={false} render={<Link href="/community/discovery" />} className="rounded-full font-bold">
                <Compass aria-hidden="true" />
                Explore communities
              </Button>
            }
          />
        ) : (
          <CommunityQueryError error={detail.error} onRetry={() => void detail.refetch()} />
        )}
        {detail.data && group?.profile ? (
          <>
            <CommunityGroupHeader detail={detail.data} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <CommunityFeed
                label={`Posts in ${group.name}`}
                posts={feed.data}
                groups={groups}
                sort={sort}
                onSortChange={setSort}
                metaVariant="author"
                isLoading={feed.isLoading}
                error={feed.error}
                onRetry={() => void feed.refetch()}
                hasNextPage={feed.hasNextPage}
                isFetchingNextPage={feed.isFetchingNextPage}
                onLoadMore={() => void feed.fetchNextPage()}
                emptyState={
                  <EmptyFeed
                    title="No posts yet"
                    body={group.joined ? "Start the conversation with a question, a route, or a photo." : "Join to write the first post."}
                    actions={
                      group.joined ? (
                        <Button
                          nativeButton={false}
                          render={<Link href={`/community/create?groupId=${group.id}&groupSlug=${encodeURIComponent(detail.data.slug)}`} />}
                          className="rounded-full font-bold"
                        >
                          <PenLine aria-hidden="true" />
                          Write the first post
                        </Button>
                      ) : (
                        <CommunityMembershipButton group={group} />
                      )
                    }
                  />
                }
              />
              <div className="xl:sticky xl:top-4 xl:self-start">
                <CommunityGroupSidebar group={group} profile={group.profile} createdAt={detail.data.createdAt} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </CommunityErrorBoundary>
  );
}
