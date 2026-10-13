"use client";

import Link from "next/link";
import { useAtom } from "jotai";
import { Compass, Flame } from "lucide-react";

import {
  communityFeedSortAtom,
  communitySearchQueryAtom,
  popularFeedSortAtom,
} from "./_components/community-atoms";
import { CommunityContextSidebar } from "./feed/community-context-sidebar";
import { CommunityErrorBoundary } from "./_components/community-error-boundary";
import { CommunityWorkspace } from "./_components/community-workspace";
import { CommunityFeed } from "./feed/community-feed";
import { useCommunityFeed, useCommunityGroups } from "./_components/community-queries";
import { useCommunityIdentity } from "./_components/community-group-queries";
import { Button } from "@/components/ui/button";
import { EmptyFeed } from "./_components/community-empty-state";

/**
 * Home shows posts from the viewer's communities; Popular shows every
 * community. Signed-out visitors have no communities, so Home shows everything.
 */
export function CommunityPage({ variant = "home" }: { variant?: "home" | "popular" }) {
  const [searchQuery, setSearchQuery] = useAtom(communitySearchQueryAtom);
  const [homeSort, setHomeSort] = useAtom(communityFeedSortAtom);
  const [popularSort, setPopularSort] = useAtom(popularFeedSortAtom);
  const { authenticated } = useCommunityIdentity();
  const home = variant === "home";
  const sort = home ? homeSort : popularSort;
  const scope = home && authenticated ? "joined" : "all";

  const groupsQuery = useCommunityGroups("");
  const feed = useCommunityFeed(searchQuery, sort, undefined, scope);

  const emptyState =
    scope === "joined" ? (
      <EmptyFeed
        title="Your home feed is waiting"
        body="Join a few communities and their newest posts will collect here."
        actions={
          <>
            <Button nativeButton={false} render={<Link href="/community/discovery" />} className="rounded-full font-bold">
              <Compass aria-hidden="true" />
              Explore communities
            </Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/community/popular" />} className="rounded-full">
              <Flame aria-hidden="true" />
              See popular posts
            </Button>
          </>
        }
      />
    ) : (
      <EmptyFeed
        title="No posts yet"
        body="Communities are just getting started. Join one and write the first post."
        actions={
          <Button nativeButton={false} render={<Link href="/community/discovery" />} className="rounded-full font-bold">
            <Compass aria-hidden="true" />
            Explore communities
          </Button>
        }
      />
    );

  return (
    <CommunityErrorBoundary>
      <CommunityWorkspace>
        <CommunityWorkspace.Content>
          {!home ? (
            <header className="flex items-center gap-3 px-1">
              <span className="flex size-10 items-center justify-center rounded-full bg-vote-up/12 text-vote-up">
                <Flame className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Popular</h1>
                <p className="text-sm text-muted-foreground">The most upvoted posts across every community.</p>
              </div>
            </header>
          ) : (
            <h1 className="sr-only">Home</h1>
          )}
          <CommunityFeed
            label={home ? "Home feed" : "Popular posts"}
            posts={feed.data}
            groups={groupsQuery.data}
            sort={sort}
            onSortChange={home ? setHomeSort : setPopularSort}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
            isLoading={feed.isLoading}
            error={feed.error}
            onRetry={() => void feed.refetch()}
            hasNextPage={feed.hasNextPage}
            isFetchingNextPage={feed.isFetchingNextPage}
            onLoadMore={() => void feed.fetchNextPage()}
            emptyState={emptyState}
          />
        </CommunityWorkspace.Content>
        <CommunityWorkspace.Aside>
          <CommunityContextSidebar
            groups={groupsQuery.data}
            isLoading={groupsQuery.isLoading}
            isError={groupsQuery.isError}
            onRetry={() => void groupsQuery.refetch()}
          />
        </CommunityWorkspace.Aside>
      </CommunityWorkspace>
    </CommunityErrorBoundary>
  );
}
